"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  demoActions,
  type DemoReport,
  type ReportReason,
} from "@/features/demo/store";
import { cn } from "@/lib/utils";

const reasons: { value: ReportReason; label: string; hint: string }[] = [
  {
    value: "spoiler",
    label: "Spoiler ohne Markierung",
    hint: "Verrät Handlung ohne Spoiler-Hinweis",
  },
  {
    value: "harassment",
    label: "Belästigung oder Hass",
    hint: "Greift Personen oder Gruppen an",
  },
  {
    value: "spam",
    label: "Spam oder Werbung",
    hint: "Wiederholte oder kommerzielle Inhalte",
  },
  {
    value: "inappropriate",
    label: "Unangemessene Inhalte",
    hint: "Gewalt, sexuelle Inhalte, Illegales",
  },
  { value: "other", label: "Etwas anderes", hint: "Bitte kurz beschreiben" },
];

const targetLabel: Record<DemoReport["targetType"], string> = {
  post: "Beitrag",
  comment: "Kommentar",
  user: "Profil",
};

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: DemoReport["targetType"];
  targetId: string;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason) {
      setError("Bitte wähle einen Grund aus.");
      return;
    }
    if (reason === "other" && note.trim().length < 10) {
      setError("Beschreibe das Problem bitte in mindestens 10 Zeichen.");
      return;
    }
    demoActions.report({
      targetType,
      targetId,
      reason,
      note: note.trim() || undefined,
    });
    toast.success("Danke für deine Meldung", {
      description:
        "Das Moderationsteam prüft sie (Demo: Meldung wird lokal gespeichert).",
    });
    setReason(null);
    setNote("");
    setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {targetLabel[targetType]} melden
            </DialogTitle>
            <DialogDescription>
              Meldungen sind anonym. Die gemeldete Person erfährt nicht, wer
              gemeldet hat.
            </DialogDescription>
          </DialogHeader>
          <fieldset
            className="grid gap-2"
            aria-describedby={error ? "report-error" : undefined}
          >
            <legend className="mb-1 text-sm font-semibold">
              Was ist das Problem?
            </legend>
            {reasons.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-accent",
                  reason === option.value && "border-brand bg-brand-soft",
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => {
                    setReason(option.value);
                    setError(null);
                  }}
                  className="mt-1 size-4 accent-[var(--primary)]"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="grid gap-1.5">
            <Label htmlFor="report-note">
              Details{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="report-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          {error && (
            <p
              id="report-error"
              role="alert"
              className="text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit">Meldung senden</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            variant={destructive ? "danger" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
