"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCheckIcon, FlagIcon, SearchXIcon } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { RelativeTime } from "@/components/feedback/relative-time";
import { StatusPill } from "@/features/moderation/components";
import { useResolvedReports } from "@/features/moderation/hooks";
import {
  reasonLabel,
  targetLabel,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from "@/features/moderation/types";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { getUserByIdSync } from "@/lib/data/users";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 rounded-md border bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

type StatusFilter = ReportStatus | "all";

export function ReportsView() {
  const reports = useResolvedReports();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [reason, setReason] = useState<ReportReason | "">("");
  const [type, setType] = useState<ReportTargetType | "">("");

  const counts: Record<StatusFilter, number> = {
    open: reports.filter((report) => report.status === "open").length,
    resolved: reports.filter((report) => report.status === "resolved").length,
    dismissed: reports.filter((report) => report.status === "dismissed").length,
    all: reports.length,
  };
  const filtered = reports.filter(
    (report) =>
      (status === "all" || report.status === status) &&
      (!reason || report.reason === reason) &&
      (!type || report.targetType === type),
  );
  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "open", label: "Offen" },
    { value: "resolved", label: "Erledigt" },
    { value: "dismissed", label: "Abgewiesen" },
    { value: "all", label: "Alle" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div
          role="group"
          aria-label="Nach Status filtern"
          className="flex flex-wrap gap-1.5"
        >
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => setStatus(option.value)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground",
                status === option.value &&
                  "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background",
              )}
            >
              {option.label}
              <span className="text-xs tabular opacity-70">
                {counts[option.value]}
              </span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <div className="grid gap-1">
            <label
              htmlFor="report-reason-filter"
              className="text-xs font-semibold text-muted-foreground"
            >
              Grund
            </label>
            <select
              id="report-reason-filter"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as ReportReason | "")
              }
              className={selectClass}
            >
              <option value="">Alle Gründe</option>
              {(Object.keys(reasonLabel) as ReportReason[]).map((value) => (
                <option key={value} value={value}>
                  {reasonLabel[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label
              htmlFor="report-type-filter"
              className="text-xs font-semibold text-muted-foreground"
            >
              Art
            </label>
            <select
              id="report-type-filter"
              value={type}
              onChange={(event) =>
                setType(event.target.value as ReportTargetType | "")
              }
              className={selectClass}
            >
              <option value="">Alle Inhalte</option>
              {(Object.keys(targetLabel) as ReportTargetType[]).map((value) => (
                <option key={value} value={value}>
                  {targetLabel[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "Meldung" : "Meldungen"}
      </p>

      {reports.length === 0 ? (
        <EmptyState icon={FlagIcon} title="Noch keine Meldungen" />
      ) : filtered.length === 0 ? (
        status === "open" && !reason && !type ? (
          <EmptyState
            icon={CheckCheckIcon}
            title="Alles erledigt"
            description="Es gibt keine offenen Meldungen. Gute Arbeit!"
            action={{
              label: "Alle Meldungen ansehen",
              onClick: () => setStatus("all"),
            }}
          />
        ) : (
          <EmptyState
            icon={SearchXIcon}
            title="Keine Meldungen für diese Filter"
            action={{
              label: "Filter zurücksetzen",
              onClick: () => {
                setStatus("all");
                setReason("");
                setType("");
              },
            }}
          />
        )
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {filtered.map((report) => {
            const reporter = getUserByIdSync(report.reporterId);
            const author = report.target.authorId
              ? getUserByIdSync(report.target.authorId)
              : undefined;
            return (
              <li key={report.id} className="relative hover:bg-accent/60">
                <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex shrink-0 items-center gap-2 sm:w-40 sm:flex-col sm:items-start">
                    <StatusPill status={report.status} />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {targetLabel[report.targetType]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[0.9375rem] font-semibold">
                      <Link
                        href={`/moderation/reports/${report.id}`}
                        className="after:absolute after:inset-0 after:content-[''] hover:underline"
                      >
                        {reasonLabel[report.reason]}
                      </Link>
                      {report.targetReportCount > 1 && (
                        <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                          {report.targetReportCount}× gemeldet
                        </span>
                      )}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {author && (
                        <span className="font-semibold text-foreground">
                          {author.username}:{" "}
                        </span>
                      )}
                      {report.target.excerpt}
                    </p>
                    {(report.target.removed || report.target.deleted) && (
                      <p className="mt-1 text-xs font-semibold text-destructive">
                        {report.target.removed
                          ? "Durch Moderation entfernt"
                          : "Von der Person gelöscht"}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground sm:w-44 sm:justify-end">
                    <UserAvatar user={reporter} size="xs" />
                    <span className="truncate">
                      {reporter?.username ?? "Unbekannt"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <RelativeTime time={report.time} className="shrink-0" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
