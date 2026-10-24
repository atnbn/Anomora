"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CircleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inputClass } from "@/components/forms/fields";
import type { ReportStatus } from "@/features/moderation/types";
import { statusLabel } from "@/features/moderation/types";
import type { UserProfile } from "@/features/profiles/types";
import { demoActions } from "@/features/demo/store";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        status === "open" && "bg-warning/15 text-warning",
        status === "resolved" && "bg-success/15 text-success",
        status === "dismissed" && "bg-muted text-muted-foreground",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function BanPill({ untilTime }: { untilTime: number | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
      {untilTime
        ? `Gesperrt bis ${formatDateTime(untilTime)}`
        : "Dauerhaft gesperrt"}
    </span>
  );
}

const DURATIONS = [
  { value: "24h", label: "24 Stunden", hours: 24 },
  { value: "7d", label: "7 Tage", hours: 24 * 7 },
  { value: "30d", label: "30 Tage", hours: 24 * 30 },
  { value: "permanent", label: "Dauerhaft", hours: null },
] as const;

/** Dialog zum Sperren eines Kontos mit Dauer und Begründung (geht ins Protokoll). */
export function BanDialog({
  open,
  onOpenChange,
  user,
  reportId,
  defaultReason = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  reportId?: string;
  defaultReason?: string;
}) {
  const [duration, setDuration] =
    useState<(typeof DURATIONS)[number]["value"]>("7d");
  const [reason, setReason] = useState(defaultReason);
  const [error, setError] = useState<string | null>(null);
  const isProtected = user.role === "moderator";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setError(null);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.trim().length < 10) {
              setError("Bitte begründe die Sperre in mindestens 10 Zeichen.");
              return;
            }
            const option = DURATIONS.find((entry) => entry.value === duration)!;
            demoActions.banUser(user.id, {
              until: option.hours
                ? new Date(Date.now() + option.hours * 3_600_000).toISOString()
                : null,
              reason,
              durationLabel: option.label,
              reportId,
            });
            toast.success(`${user.username} gesperrt (${option.label})`);
            onOpenChange(false);
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {user.username} sperren
            </DialogTitle>
            <DialogDescription>
              Gesperrte Konten können sich anmelden, aber nichts veröffentlichen
              oder kommentieren.
            </DialogDescription>
          </DialogHeader>
          {isProtected ? (
            <p
              role="alert"
              className="flex items-start gap-2 text-sm text-destructive"
            >
              <CircleAlertIcon
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              Konten mit Moderationsrechten können nicht gesperrt werden.
            </p>
          ) : (
            <>
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-semibold">Dauer</legend>
                <div className="grid grid-cols-2 gap-2">
                  {DURATIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border px-3 text-sm font-medium hover:bg-accent",
                        duration === option.value &&
                          "border-brand bg-brand-soft",
                      )}
                    >
                      <input
                        type="radio"
                        name="ban-duration"
                        value={option.value}
                        checked={duration === option.value}
                        onChange={() => setDuration(option.value)}
                        className="size-4 accent-[var(--primary)]"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-1.5">
                <label htmlFor="ban-reason" className="text-sm font-semibold">
                  Begründung
                </label>
                <textarea
                  id="ban-reason"
                  rows={3}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setError(null);
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={
                    error ? "ban-reason-error" : "ban-reason-hint"
                  }
                  className={cn(inputClass, "h-auto py-2.5")}
                />
                {error ? (
                  <p
                    id="ban-reason-error"
                    className="text-sm font-medium text-destructive"
                  >
                    {error}
                  </p>
                ) : (
                  <p
                    id="ban-reason-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Wird im Moderationsprotokoll gespeichert und der Person
                    angezeigt.
                  </p>
                )}
              </div>
            </>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            {!isProtected && (
              <Button type="submit" variant="danger">
                Konto sperren
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
