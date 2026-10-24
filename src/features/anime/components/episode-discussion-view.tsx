"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeOffIcon,
  ListIcon,
  LockIcon,
  TvIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SpoilerGuard } from "@/components/feedback/spoiler-guard";
import { PageContainer } from "@/components/layout/app-shell";
import { Panel } from "@/components/layout/section";
import type { Anime, Episode } from "@/features/anime/types";
import { AnimeArtwork } from "@/features/anime/components/anime-artwork";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import { Countdown } from "@/features/anime/components/countdown";
import { useTimedEpisodes } from "@/features/anime/episode-timeline";
import { episodeHref } from "@/features/anime/labels";
import { useComments } from "@/features/community/hooks";
import { CommentThread } from "@/features/community/components/comment-thread";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import {
  demoActions,
  requireSession,
  useDemoState,
} from "@/features/demo/store";
import { getUserByIdSync } from "@/lib/data/users";
import { formatCount, formatDateLong, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function TopComments({
  episodeId,
  spoilerActive,
}: {
  episodeId: string;
  spoilerActive: boolean;
}) {
  const target = useMemo(
    () => ({ type: "episode", episodeId }) as const,
    [episodeId],
  );
  const { threads } = useComments(target, "top");
  const top = threads.slice(0, 3).map((thread) => thread.root);
  if (top.length === 0) return null;

  return (
    <Panel as="section" labelledBy="top-comments" className="p-4">
      <h2 id="top-comments" className="text-[0.9375rem] font-bold">
        Top-Kommentare
      </h2>
      <ol className="mt-3 space-y-4">
        {top.map((comment) => {
          const author = getUserByIdSync(comment.authorId);
          return (
            <li key={comment.id} className="flex gap-2.5">
              <UserAvatar user={author} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {author?.username}
                </p>
                <SpoilerGuard
                  active={
                    spoilerActive && comment.containsSpoiler && !comment.isOwn
                  }
                  reason="Spoiler"
                >
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {comment.body}
                  </p>
                </SpoilerGuard>
                <p className="mt-1 text-xs font-semibold text-brand tabular">
                  ♥ {formatCount(comment.likeCount)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

export function EpisodeDiscussionView({
  anime,
  episode: rawEpisode,
  previous,
  next,
}: {
  anime: Anime;
  episode: Episode;
  previous?: Episode;
  next?: Episode;
}) {
  const timed = useTimedEpisodes(useMemo(() => [rawEpisode], [rawEpisode]));
  const episode = timed[0];
  const { watchedEpisodeIds, preferences, session } = useDemoState();
  const watched = Boolean(session) && watchedEpisodeIds.includes(episode.id);
  const spoilerActive = preferences.spoilerProtection && !watched;
  const title = episode.title ?? `Episode ${episode.number}`;

  function toggleWatched() {
    if (requireSession("Melde dich an, um Folgen als gesehen zu markieren.")) {
      demoActions.toggleWatched(episode.id);
    }
  }

  return (
    <>
      <div className="relative isolate overflow-hidden border-b bg-card">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          {anime.art && (
            <AnimeArtwork
              art={anime.art}
              seed={`${anime.id}-${episode.number}`}
              className="size-full"
            />
          )}
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-black/85 via-black/60 to-black/20"
        />
        <PageContainer className="text-white">
          <nav aria-label="Brotkrumen" className="text-sm">
            <ol className="flex flex-wrap items-center gap-1 text-white/75">
              <li>
                <Link
                  href={`/anime/${anime.slug}`}
                  className="inline-flex h-9 items-center gap-1 rounded-md font-semibold hover:text-white"
                >
                  <ChevronLeftIcon className="size-4" aria-hidden="true" />
                  {anime.title}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="truncate">
                Episode {episode.number}
              </li>
            </ol>
          </nav>
          <div className="mt-6 flex items-end gap-5">
            <AnimeCover
              anime={anime}
              className="hidden w-28 shrink-0 shadow-xl sm:block"
            />
            <div className="min-w-0">
              <p className="font-display text-xl font-bold tracking-wide text-white/85 uppercase">
                Episode {episode.number}
              </p>
              <h1 className="mt-0.5 text-[1.75rem] leading-tight font-bold text-balance sm:text-4xl">
                {episode.title ? `„${episode.title}“` : title}
              </h1>
              <p className="mt-2 text-sm text-white/80">
                {episode.aired
                  ? `Ausgestrahlt am ${formatDateLong(episode.airTime)}`
                  : `Erscheint am ${formatDateTime(episode.airTime)} Uhr`}
                {" · "}
                {episode.durationMinutes} Min. · Demo-Daten
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {episode.aired && (
              <Button
                size="lg"
                aria-pressed={watched}
                onClick={toggleWatched}
                className={cn(
                  watched && "bg-white text-black hover:bg-white/90",
                )}
              >
                <CheckIcon aria-hidden="true" />
                {watched ? "Als gesehen markiert" : "Als gesehen markieren"}
              </Button>
            )}
            <Link
              href={`/anime/${anime.slug}`}
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className:
                  "border-white/30 bg-black/30 text-white hover:bg-black/50 hover:text-white dark:bg-black/30",
              })}
            >
              <ListIcon aria-hidden="true" />
              Alle Episoden
            </Link>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-6">
            {!episode.aired ? (
              <Panel className="flex flex-col items-center gap-4 px-6 py-10 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <LockIcon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">
                    Diskussion öffnet nach der Ausstrahlung
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    So schützen wir alle vor Leaks. Bis dahin kannst du in der
                    vorherigen Folge mitreden.
                  </p>
                </div>
                <Countdown
                  target={episode.airTime}
                  className="w-full max-w-xs"
                />
                {previous && (
                  <Link
                    href={episodeHref(anime.slug, previous)}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Zu Episode {previous.number}
                  </Link>
                )}
              </Panel>
            ) : (
              <>
                {episode.synopsis && (
                  <Panel
                    as="section"
                    labelledBy="episode-summary"
                    className="p-4 sm:p-5"
                  >
                    <h2
                      id="episode-summary"
                      className="text-[0.9375rem] font-bold"
                    >
                      Zusammenfassung
                    </h2>
                    <SpoilerGuard
                      active={spoilerActive}
                      reason="Zusammenfassung"
                      className="mt-2"
                    >
                      <p className="leading-relaxed text-muted-foreground">
                        {episode.synopsis}
                      </p>
                    </SpoilerGuard>
                  </Panel>
                )}

                {spoilerActive && (
                  <div className="flex items-start gap-3 rounded-lg border border-brand/30 bg-brand-soft px-4 py-3 text-sm">
                    <EyeOffIcon
                      className="mt-0.5 size-4 shrink-0 text-brand"
                      aria-hidden="true"
                    />
                    <p>
                      <span className="font-semibold">
                        Spoilerschutz aktiv.
                      </span>{" "}
                      Kommentare mit Spoiler-Markierung sind verdeckt, bis du
                      die Folge als gesehen markierst.{" "}
                      <button
                        type="button"
                        onClick={toggleWatched}
                        className="font-semibold text-brand underline-offset-2 hover:underline"
                      >
                        Jetzt markieren
                      </button>
                    </p>
                  </div>
                )}

                <CommentThread
                  target={{ type: "episode", episodeId: episode.id }}
                  title={`Diskussion zu Episode ${episode.number}`}
                  defaultSort="newest"
                  spoilerProtected={!watched}
                  emptyTitle="Noch niemand hat diskutiert"
                  emptyDescription="Wie fandest du die Folge? Markiere Handlungsdetails bitte als Spoiler."
                />
              </>
            )}

            <nav
              aria-label="Episoden-Navigation"
              className="grid grid-cols-2 gap-3 border-t pt-6"
            >
              {previous ? (
                <Link
                  href={episodeHref(anime.slug, previous)}
                  className="group rounded-lg border bg-card p-3 hover:bg-accent"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <ChevronLeftIcon className="size-3.5" aria-hidden="true" />
                    Vorherige
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold">
                    {previous.number}.{" "}
                    {previous.title ?? `Episode ${previous.number}`}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  href={episodeHref(anime.slug, next)}
                  className="rounded-lg border bg-card p-3 text-right hover:bg-accent"
                >
                  <span className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground">
                    Nächste
                    <ChevronRightIcon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold">
                    {next.number}. {next.title ?? `Episode ${next.number}`}
                  </span>
                </Link>
              )}
            </nav>
          </div>

          <aside className="space-y-4" aria-label="Zur Episode">
            <Panel as="section" labelledBy="quick-links" className="p-2">
              <h2
                id="quick-links"
                className="px-2 pt-2 pb-1 text-[0.9375rem] font-bold"
              >
                Schnellzugriff
              </h2>
              <ul>
                <li>
                  <Link
                    href={`/anime/${anime.slug}`}
                    className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm font-medium hover:bg-accent"
                  >
                    <TvIcon className="size-4 text-brand" aria-hidden="true" />
                    Zur Serie
                  </Link>
                </li>
                {next && (
                  <li>
                    <Link
                      href={episodeHref(anime.slug, next)}
                      className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm font-medium hover:bg-accent"
                    >
                      <ChevronRightIcon
                        className="size-4 text-brand"
                        aria-hidden="true"
                      />
                      Nächste Folge
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    href={`/community?anime=${anime.slug}`}
                    className="flex min-h-11 items-center gap-3 rounded-md px-2 text-sm font-medium hover:bg-accent"
                  >
                    <ListIcon
                      className="size-4 text-brand"
                      aria-hidden="true"
                    />
                    Beiträge zur Serie
                  </Link>
                </li>
              </ul>
            </Panel>
            {episode.aired && (
              <TopComments
                episodeId={episode.id}
                spoilerActive={spoilerActive}
              />
            )}
          </aside>
        </div>
      </PageContainer>
    </>
  );
}
