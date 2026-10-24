"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import {
  FlagIcon,
  HeartIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/feedback/states";
import { RelativeTime } from "@/components/feedback/relative-time";
import { SpoilerGuard } from "@/components/feedback/spoiler-guard";
import type { Comment } from "@/features/community/types";
import {
  type CommentSort,
  type ResolvedComment,
  useComments,
} from "@/features/community/hooks";
import {
  ConfirmDialog,
  ReportDialog,
} from "@/features/community/components/moderation-dialogs";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { UserName } from "@/features/profiles/components/user-name";
import { useViewer } from "@/features/profiles/hooks";
import {
  demoActions,
  requireCanPost,
  requireSession,
  useDemoState,
} from "@/features/demo/store";
import { getUserByIdSync } from "@/lib/data/users";
import { formatCount, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_COMMENT_LENGTH = 600;
const PAGE_SIZE = 8;

function CommentForm({
  target,
  parentId,
  inputId,
  onDone,
  onPosted,
  compact = false,
  spoilerDefault = false,
}: {
  target: Comment["target"];
  parentId?: string;
  inputId?: string;
  onDone?: () => void;
  onPosted?: () => void;
  compact?: boolean;
  spoilerDefault?: boolean;
}) {
  const id = useId();
  const fieldId = inputId ?? `${id}-comment`;
  const { viewer } = useViewer();
  const [body, setBody] = useState("");
  const [spoiler, setSpoiler] = useState(spoilerDefault);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      noValidate
      className="flex gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!requireCanPost("Melde dich an, um zu kommentieren.")) return;
        const text = body.trim();
        if (text.length < 2) return setError("Schreib mindestens 2 Zeichen.");
        if (text.length > MAX_COMMENT_LENGTH)
          return setError(
            `Maximal ${MAX_COMMENT_LENGTH} Zeichen – du bist ${text.length - MAX_COMMENT_LENGTH} drüber.`,
          );
        demoActions.createComment({
          body: text,
          target,
          parentId,
          containsSpoiler: spoiler,
        });
        setBody("");
        setError(null);
        toast.success(
          parentId ? "Antwort veröffentlicht" : "Kommentar veröffentlicht",
        );
        onPosted?.();
        onDone?.();
      }}
    >
      {!compact && (
        <UserAvatar
          user={viewer ?? undefined}
          size="sm"
          className="mt-1 hidden sm:inline-flex"
        />
      )}
      <div className="min-w-0 flex-1">
        <label htmlFor={fieldId} className="sr-only">
          {parentId ? "Antwort schreiben" : "Kommentar schreiben"}
        </label>
        <textarea
          id={fieldId}
          value={body}
          rows={compact ? 2 : 3}
          autoFocus={compact}
          onChange={(event) => {
            setBody(event.target.value);
            setError(null);
          }}
          placeholder={
            viewer
              ? parentId
                ? "Deine Antwort …"
                : "Was denkst du?"
              : "Melde dich an, um mitzudiskutieren"
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="block w-full resize-y rounded-md border bg-background px-3 py-2.5 text-[0.9375rem] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
        {error && (
          <p
            id={`${fieldId}-error`}
            role="alert"
            className="mt-1.5 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="flex min-h-9 items-center gap-2 text-sm font-medium text-muted-foreground">
            <Switch
              checked={spoiler}
              onCheckedChange={(checked) => setSpoiler(checked)}
            />
            Spoiler
          </label>
          <div className="ml-auto flex gap-2">
            {onDone && compact && (
              <Button type="button" variant="ghost" size="sm" onClick={onDone}>
                Abbrechen
              </Button>
            )}
            <Button
              type="submit"
              size={compact ? "sm" : "default"}
              disabled={body.trim().length === 0}
            >
              {parentId ? "Antworten" : "Kommentieren"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  target,
  canReply,
  spoilerActive,
}: {
  comment: ResolvedComment;
  target: Comment["target"];
  canReply: boolean;
  spoilerActive: boolean;
}) {
  const author = getUserByIdSync(comment.authorId);
  const [replying, setReplying] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex gap-3">
      <UserAvatar user={author} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <UserName user={author} className="max-w-full" />
          <RelativeTime
            time={comment.time}
            className="text-xs text-muted-foreground"
          />
        </div>
        <SpoilerGuard
          active={spoilerActive && comment.containsSpoiler && !comment.isOwn}
          className="mt-1"
        >
          <p className="text-[0.9375rem] leading-relaxed break-words whitespace-pre-line">
            {comment.body}
          </p>
        </SpoilerGuard>
        <div className="-ml-2 mt-1 flex flex-wrap items-center">
          <button
            type="button"
            aria-pressed={comment.liked}
            aria-label={`${comment.liked ? "Gefällt mir nicht mehr" : "Gefällt mir"} – ${pluralize(comment.likeCount, "Like", "Likes")}`}
            onClick={() => {
              if (requireSession("Melde dich an, um Kommentare zu liken."))
                demoActions.toggleCommentLike(comment.id);
            }}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground",
              comment.liked && "text-brand hover:text-brand",
            )}
          >
            <HeartIcon
              className={cn("size-4", comment.liked && "fill-current")}
              aria-hidden="true"
            />
            <span className="tabular">{formatCount(comment.likeCount)}</span>
          </button>
          {canReply && (
            <button
              type="button"
              aria-expanded={replying}
              onClick={() => {
                if (requireSession("Melde dich an, um zu antworten."))
                  setReplying((value) => !value);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MessageCircleIcon className="size-4" aria-hidden="true" />
              Antworten
            </button>
          )}
          {comment.isOwn ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-destructive"
            >
              <Trash2Icon className="size-4" aria-hidden="true" />
              Löschen
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (requireSession("Melde dich an, um Inhalte zu melden."))
                  setReportOpen(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <FlagIcon className="size-4" aria-hidden="true" />
              Melden
            </button>
          )}
        </div>
        {replying && (
          <div className="mt-2">
            <CommentForm
              target={target}
              parentId={comment.parentId ?? comment.id}
              compact
              onDone={() => setReplying(false)}
            />
          </div>
        )}
      </div>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="comment"
        targetId={comment.id}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Kommentar löschen?"
        description="Dein Kommentar wird entfernt. Antworten anderer bleiben sichtbar."
        confirmLabel="Löschen"
        onConfirm={() => {
          demoActions.deleteComment(comment.id);
          toast.success("Kommentar gelöscht");
        }}
      />
    </div>
  );
}

const sortLabels: Record<CommentSort, string> = {
  oldest: "Älteste zuerst",
  newest: "Neueste zuerst",
  top: "Meiste Likes",
};

/** Kommentarbereich mit Sortierung, Antworten, Spoilerschutz und Nachladen. */
export function CommentThread({
  target,
  title = "Kommentare",
  defaultSort = "oldest",
  spoilerProtected = true,
  emptyTitle = "Noch keine Kommentare",
  emptyDescription = "Schreib den ersten Kommentar und starte die Unterhaltung.",
}: {
  target: Comment["target"];
  title?: string;
  defaultSort?: CommentSort;
  /** Wenn false (z. B. Episode gesehen), werden Spoiler nicht verdeckt. */
  spoilerProtected?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [sort, setSort] = useState<CommentSort>(defaultSort);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const { total, threads } = useComments(target, sort);
  const { preferences } = useDemoState();
  const spoilerActive = spoilerProtected && preferences.spoilerProtection;
  const sortId = useId();

  return (
    <section
      id="kommentare"
      aria-labelledby={`${sortId}-title`}
      className="scroll-mt-20 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${sortId}-title`} className="text-[1.0625rem] font-bold">
          {title}{" "}
          <span className="font-semibold text-muted-foreground tabular">
            {formatCount(total)}
          </span>
        </h2>
        {total > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor={sortId} className="text-sm text-muted-foreground">
              Sortieren
            </label>
            <select
              id={sortId}
              value={sort}
              onChange={(event) => setSort(event.target.value as CommentSort)}
              className="h-9 rounded-md border bg-background px-2.5 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {(Object.keys(sortLabels) as CommentSort[]).map((value) => (
                <option key={value} value={value}>
                  {sortLabels[value]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <CommentForm
        target={target}
        inputId="comment-input"
        onPosted={() => {
          // Eigene neue Kommentare sofort zeigen, auch wenn sie am Ende der Liste stehen.
          if (sort === "oldest") setVisible(Number.POSITIVE_INFINITY);
        }}
      />

      {threads.length === 0 ? (
        <EmptyState
          icon={MessagesSquareIcon}
          title={emptyTitle}
          description={emptyDescription}
          compact
        />
      ) : (
        <ol className="divide-y">
          {threads.slice(0, visible).map(({ root, replies }) => (
            <li key={root.id} className="py-4 first:pt-1">
              <CommentItem
                comment={root}
                target={target}
                canReply
                spoilerActive={spoilerActive}
              />
              {replies.length > 0 && (
                <ol className="mt-3 space-y-4 border-l-2 pl-4 sm:ml-4">
                  {replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentItem
                        comment={reply}
                        target={target}
                        canReply
                        spoilerActive={spoilerActive}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}

      {threads.length > visible && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setVisible((value) => value + PAGE_SIZE)}
        >
          Weitere Kommentare laden ({threads.length - visible})
        </Button>
      )}
    </section>
  );
}
