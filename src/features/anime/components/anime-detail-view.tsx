"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  MessagesSquareIcon,
  Share2Icon,
  StarIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import { PageTabs } from "@/components/layout/page-tabs";
import { Panel, Section } from "@/components/layout/section";
import type { Anime } from "@/features/anime/types";
import { AnimeCard } from "@/features/anime/components/anime-card";
import {
  AnimeBackdrop,
  AnimeCover,
} from "@/features/anime/components/anime-cover";
import { Countdown } from "@/features/anime/components/countdown";
import { EpisodeList } from "@/features/anime/components/episode-list";
import { useRegisterAnime } from "@/features/anime/catalog-provider";
import { FavoriteButton } from "@/features/anime/components/favorite-button";
import { useSchedules } from "@/features/anime/episode-timeline";
import { episodeHref, statusLabel } from "@/features/anime/labels";
import { usePosts } from "@/features/community/hooks";
import { PostCard } from "@/features/community/components/post-card";
import { PostComposer } from "@/features/community/components/post-composer";
import { listAnimeSync } from "@/lib/data/anime";
import { formatCount, formatDateTime } from "@/lib/format";

function NextEpisodePanel({ anime }: { anime: Anime }) {
  const list = useMemo(() => [anime], [anime]);
  const [schedule] = useSchedules(list);
  const { upcoming, latest } = schedule;

  return (
    <Panel as="section" labelledBy="next-episode" className="p-4">
      <h2 id="next-episode" className="text-[0.9375rem] font-bold">
        Nächste Folge
      </h2>
      {upcoming ? (
        <>
          <p className="mt-3 font-display text-2xl leading-none font-bold">
            Episode {upcoming.number}
          </p>
          {upcoming.title && (
            <p className="mt-1 text-sm font-semibold">„{upcoming.title}“</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(upcoming.airTime)} Uhr ·{" "}
            {upcoming.live ? "laut AniList" : "Demo-Termin"}
          </p>
          <Countdown target={upcoming.airTime} className="mt-3" />
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {anime.status === "finished"
            ? "Die Serie ist abgeschlossen."
            : "Aktuell ist keine neue Folge angekündigt."}
        </p>
      )}
      {latest && (
        <Link
          href={episodeHref(anime.slug, latest)}
          className={buttonVariants({
            variant: "outline",
            className: "mt-4 w-full",
          })}
        >
          <MessagesSquareIcon aria-hidden="true" />
          Episode {latest.number} diskutieren
        </Link>
      )}
    </Panel>
  );
}

function CommunityTab({ anime }: { anime: Anime }) {
  const posts = usePosts().filter((post) => post.animeId === anime.id);
  return (
    <div className="space-y-4">
      <PostComposer defaultAnimeId={anime.id} />
      {posts.length === 0 ? (
        <EmptyState
          icon={MessagesSquareIcon}
          title={`Noch keine Beiträge zu ${anime.title}`}
          description="Teile deine Gedanken, Theorien oder Fanart als Erste:r."
        />
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnimeDetailView({ anime }: { anime: Anime }) {
  useRegisterAnime(anime);
  const posts = usePosts().filter((post) => post.animeId === anime.id);
  const similar = listAnimeSync({ sort: "score" })
    .filter(
      (other) =>
        other.id !== anime.id &&
        other.genres.some((genre) => anime.genres.includes(genre)),
    )
    .slice(0, 4);

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link zur Serie kopiert");
    } catch {
      toast.error("Link konnte nicht kopiert werden", { description: url });
    }
  }

  return (
    <>
      <div className="relative isolate overflow-hidden border-b">
        <AnimeBackdrop
          anime={anime}
          seed={`${anime.id}-banner`}
          priority
          className="-z-10 opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-background via-background/85 to-background/30"
        />
        <PageContainer className="pb-6 lg:pb-8">
          <Link
            href="/anime"
            className="-ml-2 inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            Entdecken
          </Link>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
            <AnimeCover
              anime={anime}
              priority
              sizes="(min-width: 640px) 220px, 45vw"
              className="w-36 shrink-0 shadow-xl ring-1 ring-black/10 sm:w-48 lg:w-56"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand">
                {statusLabel[anime.status]}
              </p>
              <h1 className="mt-1 text-3xl leading-tight font-bold tracking-tight text-balance break-words sm:text-4xl">
                {anime.title}
              </h1>
              {anime.originalTitle && (
                <p className="mt-1 text-muted-foreground">
                  {anime.originalTitle}
                </p>
              )}
              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div className="flex gap-1">
                  <dt className="sr-only">Start</dt>
                  <dd>{anime.year}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="sr-only">Studio</dt>
                  <dd>{anime.studio}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="sr-only">Episoden</dt>
                  <dd>
                    {anime.episodeCount > 0
                      ? `${formatCount(anime.episodeCount)} Episoden`
                      : "Noch keine Episoden"}
                  </dd>
                </div>
                <div className="flex items-center gap-1">
                  <dt className="sr-only">Bewertung</dt>
                  <dd className="inline-flex items-center gap-1 font-semibold">
                    <StarIcon
                      className="size-4 fill-current text-warning"
                      aria-hidden="true"
                    />
                    {anime.score} / 100
                  </dd>
                </div>
              </dl>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Genres">
                {anime.genres.map((genre) => (
                  <li key={genre}>
                    <Link
                      href={`/anime?genre=${encodeURIComponent(genre)}`}
                      className="inline-flex h-8 items-center rounded-full border bg-background/60 px-3 text-xs font-semibold hover:bg-accent"
                    >
                      {genre}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <FavoriteButton anime={anime} />
                <Button size="lg" variant="outline" onClick={share}>
                  <Share2Icon aria-hidden="true" />
                  Teilen
                </Button>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <PageTabs
            label="Bereiche der Serie"
            tabs={[
              {
                value: "overview",
                label: "Übersicht",
                content: (
                  <div className="space-y-8">
                    <Section title="Handlung">
                      {anime.synopsis ? (
                        <p
                          lang={
                            anime.synopsisLanguage === "en" ? "en" : undefined
                          }
                          className="max-w-[68ch] leading-relaxed whitespace-pre-line"
                        >
                          {anime.synopsis}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          Für diese Serie ist noch keine Beschreibung verfügbar.
                        </p>
                      )}
                      {anime.synopsisLanguage === "en" && anime.synopsis && (
                        <p className="text-xs text-muted-foreground">
                          Beschreibung von AniList, nur auf Englisch verfügbar.
                        </p>
                      )}
                    </Section>
                    <Section title="Details">
                      <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">Studio</dt>
                        <dd className="font-medium">{anime.studio}</dd>
                        <dt className="text-muted-foreground">
                          Erstausstrahlung
                        </dt>
                        <dd className="font-medium">{anime.year}</dd>
                        <dt className="text-muted-foreground">Status</dt>
                        <dd className="font-medium">
                          {statusLabel[anime.status]}
                        </dd>
                        <dt className="text-muted-foreground">Genres</dt>
                        <dd className="font-medium">
                          {anime.genres.join(", ")}
                        </dd>
                        <dt className="text-muted-foreground">Quelle</dt>
                        <dd className="font-medium">
                          {anime.source === "anilist" ? (
                            <a
                              href={anime.siteUrl ?? "https://anilist.co"}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand underline-offset-2 hover:underline"
                            >
                              AniList
                            </a>
                          ) : (
                            "Demo-Katalog (AniList gerade nicht erreichbar)"
                          )}
                        </dd>
                      </dl>
                    </Section>
                    {similar.length > 0 && (
                      <Section title="Ähnliche Anime">
                        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {similar.map((other) => (
                            <li key={other.id}>
                              <AnimeCard anime={other} />
                            </li>
                          ))}
                        </ul>
                      </Section>
                    )}
                  </div>
                ),
              },
              {
                value: "episodes",
                label: "Episoden",
                count: anime.episodeCount,
                content: <EpisodeList anime={anime} />,
              },
              {
                value: "community",
                label: "Community",
                count: posts.length,
                content: <CommunityTab anime={anime} />,
              },
            ]}
          />
          <aside className="space-y-4" aria-label="Termine">
            <NextEpisodePanel anime={anime} />
            {anime.status === "upcoming" && (
              <EmptyState
                compact
                icon={CalendarDaysIcon}
                title="Angekündigt"
                description="Favorisiere die Serie, um sie auf deinem Dashboard zu sehen, sobald Termine feststehen."
              />
            )}
          </aside>
        </div>
      </PageContainer>
    </>
  );
}
