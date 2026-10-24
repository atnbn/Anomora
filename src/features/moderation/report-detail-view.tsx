"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  BanIcon,
  CheckIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  FileQuestionIcon,
  RotateCcwIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/forms/fields";
import { EmptyState } from "@/components/feedback/states";
import { RelativeTime } from "@/components/feedback/relative-time";
import { Panel } from "@/components/layout/section";
import { ConfirmDialog } from "@/features/community/components/moderation-dialogs";
import {
  BanDialog,
  BanPill,
  StatusPill,
} from "@/features/moderation/components";
import {
  useActiveBan,
  useResolvedLog,
  useResolvedReports,
} from "@/features/moderation/hooks";
import {
  actionLabel,
  reasonLabel,
  targetLabel,
} from "@/features/moderation/types";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import {
  profileHref,
  UserName,
} from "@/features/profiles/components/user-name";
import { demoActions, useDemoState } from "@/features/demo/store";
import { getUserByIdSync } from "@/lib/data/users";
import { formatDateLong, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReportDetailView({ reportId }: { reportId: string }) {
  const reports = useResolvedReports();
  const log = useResolvedLog();
  const { hydrated } = useDemoState();
  const report = reports.find((entry) => entry.id === reportId);
  const author = report?.target.authorId
    ? getUserByIdSync(report.target.authorId)
    : undefined;
  const ban = useActiveBan(author?.id);
  const [note, setNote] = useState("");
  const [banOpen, setBanOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [unbanOpen, setUnbanOpen] = useState(false);

  if (!report) {
    return hydrated ? (
      <EmptyState
        icon={FileQuestionIcon}
        title="Meldung nicht gefunden"
        description="Die Meldung existiert nicht oder wurde zurückgesetzt."
        action={{ label: "Zur Übersicht", href: "/moderation" }}
      />
    ) : null;
  }

  const reporter = getUserByIdSync(report.reporterId);
  const handler = report.handledBy
    ? getUserByIdSync(report.handledBy)
    : undefined;
  const related = reports.filter(
    (entry) =>
      entry.id !== report.id &&
      entry.targetType === report.targetType &&
      entry.targetId === report.targetId,
  );
  const authorReports = author
    ? reports.filter((entry) => entry.target.authorId === author.id).length
    : 0;
  const history = log.filter(
    (entry) =>
      (entry.targetType === report.targetType &&
        entry.targetId === report.targetId) ||
      (author && entry.targetType === "user" && entry.targetId === author.id),
  );
  const canRemove =
    report.targetType !== "user" &&
    !report.target.removed &&
    !report.target.deleted;
  const contentType =
    report.targetType === "user" ? undefined : report.targetType;

  return (
    <div>
      <Link
        href="/moderation"
        className="-ml-2 inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" aria-hidden="true" />
        Alle Meldungen
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">{reasonLabel[report.reason]}</h2>
        <StatusPill status={report.status} />
        <span className="text-sm text-muted-foreground">
          {targetLabel[report.targetType]} · gemeldet{" "}
          <RelativeTime time={report.time} />
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel as="section" labelledBy="reported-content" className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="reported-content" className="font-bold">
                Gemeldeter Inhalt
              </h3>
              {report.target.href && (
                <Link
                  href={report.target.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                >
                  In der App öffnen
                  <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
            {report.target.context && (
              <p className="mt-1 text-sm text-muted-foreground">
                {report.target.contextHref &&
                report.targetType === "comment" ? (
                  <Link
                    href={report.target.contextHref}
                    className="hover:underline"
                  >
                    {report.target.context}
                  </Link>
                ) : (
                  report.target.context
                )}
              </p>
            )}
            {(report.target.removed || report.target.deleted) && (
              <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                {report.target.removed
                  ? "Dieser Inhalt wurde durch die Moderation entfernt und ist für niemanden mehr sichtbar."
                  : "Die Person hat diesen Inhalt selbst gelöscht."}
              </p>
            )}
            <div className="mt-4 rounded-md border bg-background p-4">
              {author && (
                <div className="mb-3 flex items-center gap-2.5">
                  <UserAvatar user={author} size="sm" />
                  <UserName user={author} />
                  {ban && <BanPill untilTime={ban.untilTime} />}
                </div>
              )}
              {report.targetType === "user" && author ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">Anzeigename</dt>
                  <dd className="break-words">{author.displayName}</dd>
                  <dt className="text-muted-foreground">Nutzername</dt>
                  <dd className="break-all">{author.username}</dd>
                  <dt className="text-muted-foreground">Beschreibung</dt>
                  <dd className="break-words">{author.bio ?? "–"}</dd>
                  <dt className="text-muted-foreground">Dabei seit</dt>
                  <dd>{formatDateLong(Date.parse(author.joinedAt))}</dd>
                </dl>
              ) : (
                <p className="leading-relaxed break-words whitespace-pre-line">
                  {report.target.excerpt}
                </p>
              )}
              {(report.target.post?.containsSpoiler ||
                report.target.comment?.containsSpoiler) && (
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  Als Spoiler markiert – in der Moderation unverdeckt angezeigt.
                </p>
              )}
            </div>
          </Panel>

          <Panel as="section" labelledBy="report-details" className="p-5">
            <h3 id="report-details" className="font-bold">
              Meldung
            </h3>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Gemeldet von</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <UserAvatar user={reporter} size="xs" />
                <span className="truncate">
                  {reporter?.username ?? "Unbekannt"}
                </span>
              </dd>
              <dt className="text-muted-foreground">Zeitpunkt</dt>
              <dd>{formatDateTime(report.time)} Uhr</dd>
              <dt className="text-muted-foreground">Grund</dt>
              <dd>{reasonLabel[report.reason]}</dd>
              <dt className="text-muted-foreground">Hinweis</dt>
              <dd className="break-words">{report.note ?? "–"}</dd>
              {handler && report.handledTime && (
                <>
                  <dt className="text-muted-foreground">Bearbeitet</dt>
                  <dd>
                    {handler.username} · {formatDateTime(report.handledTime)}{" "}
                    Uhr
                  </dd>
                </>
              )}
            </dl>
            {related.length > 0 && (
              <div className="mt-5 border-t pt-4">
                <h4 className="text-sm font-semibold">
                  Weitere Meldungen zu diesem Inhalt ({related.length})
                </h4>
                <ul className="mt-2 space-y-1.5">
                  {related.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={`/moderation/reports/${entry.id}`}
                        className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <StatusPill status={entry.status} />
                        {reasonLabel[entry.reason]}
                        <span className="text-xs text-muted-foreground">
                          von {getUserByIdSync(entry.reporterId)?.username} ·{" "}
                          <RelativeTime time={entry.time} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel as="section" labelledBy="report-history" className="p-5">
            <h3 id="report-history" className="font-bold">
              Verlauf
            </h3>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Noch keine Moderationsaktionen zu diesem Inhalt oder dieser
                Person.
              </p>
            ) : (
              <ol className="mt-3 space-y-3 border-l-2 pl-4">
                {history.map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <p>
                      <span className="font-semibold">
                        {actionLabel[entry.action]}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        von {getUserByIdSync(entry.moderatorId)?.username} ·{" "}
                        <RelativeTime time={entry.time} />
                      </span>
                    </p>
                    {entry.note && (
                      <p className="mt-0.5 text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <aside
          aria-label="Aktionen"
          className="space-y-4 xl:sticky xl:top-24 xl:self-start"
        >
          <Panel className="p-5">
            <h3 className="font-bold">Aktionen</h3>
            {report.status === "open" ? (
              <>
                <div className="mt-3 grid gap-1.5">
                  <label
                    htmlFor="moderation-note"
                    className="text-sm font-semibold"
                  >
                    Notiz für das Protokoll{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="moderation-note"
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className={cn(inputClass, "h-auto py-2.5 text-sm")}
                  />
                </div>
                <div className="mt-4 grid gap-2">
                  {canRemove && (
                    <Button
                      variant="danger"
                      className="justify-start"
                      onClick={() => setRemoveOpen(true)}
                    >
                      <Trash2Icon aria-hidden="true" />
                      Inhalt entfernen
                    </Button>
                  )}
                  {author && !ban && (
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => setBanOpen(true)}
                    >
                      <BanIcon aria-hidden="true" />
                      {author.username} sperren …
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      demoActions.setReportStatus(report.id, "resolved", note);
                      setNote("");
                      toast.success("Meldung als erledigt markiert");
                    }}
                  >
                    <CheckIcon aria-hidden="true" />
                    Als erledigt markieren
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      demoActions.setReportStatus(report.id, "dismissed", note);
                      setNote("");
                      toast.success("Meldung abgewiesen");
                    }}
                  >
                    <XIcon aria-hidden="true" />
                    Abweisen – kein Verstoß
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-3 grid gap-3 text-sm">
                <p className="text-muted-foreground">
                  Diese Meldung ist abgeschlossen (
                  {report.status === "resolved" ? "erledigt" : "abgewiesen"}).
                </p>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    demoActions.reopenReport(report.id);
                    toast.success("Meldung wieder geöffnet");
                  }}
                >
                  <RotateCcwIcon aria-hidden="true" />
                  Wieder öffnen
                </Button>
              </div>
            )}
            {report.target.removed && contentType && (
              <Button
                variant="outline"
                className="mt-2 w-full justify-start"
                onClick={() => {
                  demoActions.restoreContent(contentType, report.targetId);
                  toast.success("Inhalt wiederhergestellt");
                }}
              >
                <RotateCcwIcon aria-hidden="true" />
                Inhalt wiederherstellen
              </Button>
            )}
            {ban && author && (
              <Button
                variant="outline"
                className="mt-2 w-full justify-start"
                onClick={() => setUnbanOpen(true)}
              >
                <RotateCcwIcon aria-hidden="true" />
                Sperre aufheben
              </Button>
            )}
          </Panel>

          {author && (
            <Panel className="p-5 text-sm">
              <h3 className="font-bold">Über die Person</h3>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-muted-foreground">Meldungen gesamt</dt>
                <dd className="tabular">{authorReports}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{ban ? <BanPill untilTime={ban.untilTime} /> : "Aktiv"}</dd>
              </dl>
              <Link
                href={profileHref(author)}
                className="mt-3 inline-flex font-semibold text-brand hover:underline"
              >
                Profil ansehen
              </Link>
            </Panel>
          )}
        </aside>
      </div>

      {contentType && (
        <ConfirmDialog
          open={removeOpen}
          onOpenChange={setRemoveOpen}
          title={`${targetLabel[contentType]} entfernen?`}
          description="Der Inhalt wird für alle ausgeblendet. Alle offenen Meldungen dazu werden als erledigt markiert. Du kannst ihn später wiederherstellen."
          confirmLabel="Entfernen"
          onConfirm={() => {
            demoActions.removeContent(contentType, report.targetId, {
              reportId: report.id,
              note,
            });
            setNote("");
            toast.success(`${targetLabel[contentType]} entfernt`);
          }}
        />
      )}
      {author && (
        <>
          <BanDialog
            open={banOpen}
            onOpenChange={setBanOpen}
            user={author}
            reportId={report.id}
            defaultReason={note || reasonLabel[report.reason]}
          />
          <ConfirmDialog
            open={unbanOpen}
            onOpenChange={setUnbanOpen}
            title={`Sperre von ${author.username} aufheben?`}
            description="Die Person kann danach wieder Beiträge und Kommentare veröffentlichen."
            confirmLabel="Sperre aufheben"
            destructive={false}
            onConfirm={() => {
              demoActions.unbanUser(author.id, note);
              toast.success(`Sperre von ${author.username} aufgehoben`);
            }}
          />
        </>
      )}
    </div>
  );
}
