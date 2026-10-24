"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  BanIcon,
  BookmarkIcon,
  FlagIcon,
  HeartIcon,
  LinkIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RelativeTime } from "@/components/feedback/relative-time";
import { SpoilerGuard } from "@/components/feedback/spoiler-guard";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import type { ResolvedPost } from "@/features/community/hooks";
import { categoryLabel } from "@/features/community/components/post-composer";
import {
  ConfirmDialog,
  ReportDialog,
} from "@/features/community/components/moderation-dialogs";
import { EditPostDialog } from "@/features/community/components/edit-post-dialog";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import {
  profileHref,
  UserName,
} from "@/features/profiles/components/user-name";
import {
  demoActions,
  requireSession,
  useDemoState,
} from "@/features/demo/store";
import { getAnimeByIdSync } from "@/lib/data/anime";
import { getUserByIdSync } from "@/lib/data/users";
import { formatCount, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

const COLLAPSE_AT = 320;

export const postHref = (postId: string) => `/community/posts/${postId}`;

async function copyLink(path: string) {
  const url = `${window.location.origin}${path}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link kopiert");
  } catch {
    toast.error("Link konnte nicht kopiert werden", { description: url });
  }
}

function MediaGrid({ post }: { post: ResolvedPost }) {
  const items = post.media
    .map((media) => ({ media, anime: getAnimeByIdSync(media.animeId) }))
    .filter((item) => item.anime !== undefined);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "mt-3 grid gap-1.5 overflow-hidden rounded-md",
        items.length === 1 && "grid-cols-1",
        items.length === 2 && "grid-cols-2",
        items.length >= 3 && "grid-cols-3 grid-rows-2",
      )}
    >
      {items.map(({ media, anime }, index) => (
        <figure
          key={`${media.animeId}-${media.variant}`}
          className={cn(
            "relative",
            items.length === 1 && "aspect-[16/9]",
            items.length === 2 && "aspect-[4/3]",
            items.length >= 3 &&
              (index === 0
                ? "col-span-2 row-span-2 aspect-square"
                : "aspect-square"),
          )}
        >
          <AnimeCover
            anime={anime!}
            variant={media.variant}
            preferArt
            aspect="fill"
            className="rounded-none"
          />
          <figcaption className="sr-only">{media.alt}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function PostCard({
  post,
  variant = "feed",
  headingLevel = 3,
}: {
  post: ResolvedPost;
  /** "detail" zeigt den ganzen Text und verlinkt nicht auf sich selbst. */
  variant?: "feed" | "detail";
  headingLevel?: 2 | 3;
}) {
  const author = getUserByIdSync(post.authorId);
  const anime = post.animeId ? getAnimeByIdSync(post.animeId) : undefined;
  const { preferences } = useDemoState();
  const [expanded, setExpanded] = useState(variant === "detail");
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const long = post.body.length > COLLAPSE_AT;
  const body =
    long && !expanded
      ? `${post.body.slice(0, COLLAPSE_AT).trimEnd()} …`
      : post.body;
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article
      className="rounded-lg border bg-card p-4 sm:p-5"
      aria-labelledby={`post-${post.id}-author`}
    >
      <header className="flex items-start gap-3">
        <Link
          href={author ? profileHref(author) : "#"}
          tabIndex={-1}
          aria-hidden="true"
        >
          <UserAvatar user={author} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Heading
            id={`post-${post.id}-author`}
            className="text-[0.9375rem] leading-tight"
          >
            <UserName user={author} />
          </Heading>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
            {variant === "feed" ? (
              <Link href={postHref(post.id)} className="hover:underline">
                <RelativeTime time={post.time} />
              </Link>
            ) : (
              <RelativeTime time={post.time} />
            )}
            {post.editedAt && <span>· bearbeitet</span>}
            {anime && (
              <>
                <span aria-hidden="true">·</span>
                <Link
                  href={`/anime/${anime.slug}`}
                  className="max-w-[14rem] truncate font-medium hover:text-foreground hover:underline"
                >
                  {anime.title}
                </Link>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{categoryLabel[post.category]}</span>
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Weitere Aktionen für diesen Beitrag"
            className="-mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MoreHorizontalIcon className="size-5" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuItem
              className="min-h-10 gap-2.5 px-2.5"
              onClick={() => copyLink(postHref(post.id))}
            >
              <LinkIcon aria-hidden="true" />
              Link kopieren
            </DropdownMenuItem>
            {post.isOwn ? (
              <>
                <DropdownMenuItem
                  className="min-h-10 gap-2.5 px-2.5"
                  onClick={() => setEditOpen(true)}
                >
                  <PencilIcon aria-hidden="true" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="min-h-10 gap-2.5 px-2.5"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2Icon aria-hidden="true" />
                  Löschen
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  className="min-h-10 gap-2.5 px-2.5"
                  onClick={() => {
                    if (requireSession("Melde dich an, um Inhalte zu melden."))
                      setReportOpen(true);
                  }}
                >
                  <FlagIcon aria-hidden="true" />
                  Beitrag melden
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="min-h-10 gap-2.5 px-2.5"
                  onClick={() => {
                    if (
                      requireSession("Melde dich an, um Nutzer zu blockieren.")
                    )
                      setBlockOpen(true);
                  }}
                >
                  <BanIcon aria-hidden="true" />
                  <span className="truncate">
                    {author?.username ?? "Nutzer"} blockieren
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <SpoilerGuard
        active={
          post.containsSpoiler && preferences.spoilerProtection && !post.isOwn
        }
        reason={anime ? `Spoiler zu ${anime.title}` : "Enthält Spoiler"}
        className="mt-3"
      >
        <p className="text-[0.9375rem] leading-relaxed break-words whitespace-pre-line">
          {body}
        </p>
        {long && variant === "feed" && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="mt-1 text-sm font-semibold text-brand hover:underline"
          >
            {expanded ? "Weniger anzeigen" : "Mehr anzeigen"}
          </button>
        )}
        <MediaGrid post={post} />
      </SpoilerGuard>

      <footer className="-mx-2 mt-3 flex items-center gap-1">
        <button
          type="button"
          aria-pressed={post.liked}
          aria-label={`${post.liked ? "Gefällt mir nicht mehr" : "Gefällt mir"} – ${pluralize(post.likeCount, "Like", "Likes")}`}
          onClick={() => {
            if (requireSession("Melde dich an, um Beiträge zu liken."))
              demoActions.togglePostLike(post.id);
          }}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            post.liked && "text-brand hover:text-brand",
          )}
        >
          <HeartIcon
            className={cn("size-[1.125rem]", post.liked && "fill-current")}
            aria-hidden="true"
          />
          <span className="tabular">{formatCount(post.likeCount)}</span>
        </button>
        {variant === "feed" ? (
          <Link
            href={`${postHref(post.id)}#kommentare`}
            aria-label={`${pluralize(post.commentCount, "Kommentar", "Kommentare")} ansehen`}
            className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MessageCircleIcon className="size-[1.125rem]" aria-hidden="true" />
            <span className="tabular">{formatCount(post.commentCount)}</span>
          </Link>
        ) : (
          <a
            href="#comment-input"
            className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MessageCircleIcon className="size-[1.125rem]" aria-hidden="true" />
            Kommentieren
          </a>
        )}
        <button
          type="button"
          onClick={() => copyLink(postHref(post.id))}
          className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Share2Icon className="size-[1.125rem]" aria-hidden="true" />
          <span className="max-sm:sr-only">Teilen</span>
        </button>
        <button
          type="button"
          aria-pressed={post.saved}
          aria-label={
            post.saved ? "Gespeichert – entfernen" : "Beitrag speichern"
          }
          onClick={() => {
            if (!requireSession("Melde dich an, um Beiträge zu speichern."))
              return;
            demoActions.togglePostSaved(post.id);
            toast.success(
              post.saved ? "Nicht mehr gespeichert" : "Beitrag gespeichert",
            );
          }}
          className={cn(
            "ml-auto flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground",
            post.saved && "text-brand hover:text-brand",
          )}
        >
          <BookmarkIcon
            className={cn("size-[1.125rem]", post.saved && "fill-current")}
            aria-hidden="true"
          />
        </button>
      </footer>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="post"
        targetId={post.id}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Beitrag löschen?"
        description="Der Beitrag und seine Kommentare werden entfernt. Das kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={() => {
          demoActions.deletePost(post.id);
          toast.success("Beitrag gelöscht");
        }}
      />
      <ConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title={`${author?.username ?? "Nutzer"} blockieren?`}
        description="Du siehst keine Beiträge und Kommentare mehr von dieser Person, und ihr folgt euch nicht mehr. Du kannst das jederzeit in den Einstellungen aufheben."
        confirmLabel="Blockieren"
        onConfirm={() => {
          demoActions.toggleBlock(post.authorId);
          toast.success(`${author?.username ?? "Nutzer"} blockiert`, {
            action: {
              label: "Rückgängig",
              onClick: () => demoActions.toggleBlock(post.authorId),
            },
          });
        }}
      />
      {post.isOwn && (
        <EditPostDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          post={post}
        />
      )}
    </article>
  );
}
