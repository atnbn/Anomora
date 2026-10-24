"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BanIcon,
  CheckIcon,
  ScrollTextIcon,
  SearchXIcon,
  Trash2Icon,
  UndoIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { useResolvedLog, useTargetResolver } from "@/features/moderation/hooks";
import {
  actionLabel,
  targetLabel,
  type ModerationAction,
} from "@/features/moderation/types";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { getUserByIdSync } from "@/lib/data/users";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const icons: Record<ModerationAction, LucideIcon> = {
  remove_content: Trash2Icon,
  restore_content: UndoIcon,
  ban_user: BanIcon,
  unban_user: UndoIcon,
  resolve_report: CheckIcon,
  dismiss_report: XIcon,
};

export function ModerationLogView() {
  const log = useResolvedLog();
  const resolve = useTargetResolver();
  const [action, setAction] = useState<ModerationAction | "">("");
  const filtered = action
    ? log.filter((entry) => entry.action === action)
    : log;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "Eintrag" : "Einträge"} ·
          neueste zuerst
        </p>
        <div className="grid gap-1">
          <label
            htmlFor="log-action-filter"
            className="text-xs font-semibold text-muted-foreground"
          >
            Aktion
          </label>
          <select
            id="log-action-filter"
            value={action}
            onChange={(event) =>
              setAction(event.target.value as ModerationAction | "")
            }
            className="h-10 rounded-md border bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <option value="">Alle Aktionen</option>
            {(Object.keys(actionLabel) as ModerationAction[]).map((value) => (
              <option key={value} value={value}>
                {actionLabel[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {log.length === 0 ? (
        <EmptyState
          icon={ScrollTextIcon}
          title="Noch keine Moderationsaktionen"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title="Keine Einträge für diese Aktion"
          action={{
            label: "Filter zurücksetzen",
            onClick: () => setAction(""),
          }}
        />
      ) : (
        <ol className="divide-y overflow-hidden rounded-lg border bg-card">
          {filtered.map((entry) => {
            const Icon = icons[entry.action];
            const moderator = getUserByIdSync(entry.moderatorId);
            const target = resolve(entry.targetType, entry.targetId);
            const targetUser =
              entry.targetType === "user"
                ? getUserByIdSync(entry.targetId)
                : undefined;
            const destructive =
              entry.action === "remove_content" || entry.action === "ban_user";
            return (
              <li key={entry.id} className="flex gap-3 p-4">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    destructive
                      ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {actionLabel[entry.action]}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {targetLabel[entry.targetType]}
                      {targetUser ? ` ${targetUser.username}` : ""}
                    </span>
                  </p>
                  {entry.targetType !== "user" && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      „{target.excerpt}“
                    </p>
                  )}
                  {entry.note && (
                    <p className="mt-1 text-sm break-words">{entry.note}</p>
                  )}
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <UserAvatar user={moderator} size="xs" />
                    {moderator?.username ?? "Unbekannt"}
                    <span aria-hidden="true">·</span>
                    <time dateTime={new Date(entry.time).toISOString()}>
                      {formatDateTime(entry.time)} Uhr
                    </time>
                    {entry.reportId && (
                      <>
                        <span aria-hidden="true">·</span>
                        <Link
                          href={`/moderation/reports/${entry.reportId}`}
                          className="font-semibold text-brand hover:underline"
                        >
                          Zur Meldung
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
