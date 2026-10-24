"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  CompassIcon,
  LogInIcon,
  MessagesSquareIcon,
  SparklesIcon,
  UserRoundPenIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/states";
import { SpoilerGuard } from "@/components/feedback/spoiler-guard";
import { PageContainer } from "@/components/layout/app-shell";
import { Panel, Section } from "@/components/layout/section";
import type { Anime } from "@/features/anime/types";
import { AnimeCard } from "@/features/anime/components/anime-card";
import { AnimeArtwork } from "@/features/anime/components/anime-artwork";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import {
  Countdown,
  CountdownBadge,
} from "@/features/anime/components/countdown";
import { FavoriteToggle } from "@/features/anime/components/favorite-button";
import {
  type AnimeSchedule,
  useSchedules,
} from "@/features/anime/episode-timeline";
import { episodeHref } from "@/features/anime/labels";
import { useEpisodeCommentCounts } from "@/features/community/hooks";
import {
  PopularPostsPanel,
  SuggestedUsersPanel,
} from "@/features/community/components/community-rail";
import { useViewer } from "@/features/profiles/hooks";
import { demoActions, useDemoState } from "@/features/demo/store";
import { useClock } from "@/features/demo/clock";
import { getAnimeByIdSync, listAnimeSync } from "@/lib/data/anime";
import { formatCount, formatDateTime } from "@/lib/format";

function greeting(now: number) {
  const hour = Number(
    new Intl.DateTimeFormat("de-DE", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Berlin",
    }).format(now),
  );
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Hallo";
  return "Guten Abend";
}

function HeroFeature({ schedule }: { schedule: AnimeSchedule }) {
  const { anime, upcoming, latest } = schedule;
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden rounded-xl border bg-card"
    >
      <div className="grid md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="relative min-h-56 md:min-h-[19rem]">
          {anime.art ? (
            <AnimeArtwork
              art={anime.art}
              seed={`${anime.id}-hero`}
              className="absolute inset-0 size-full"
            />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <p className="text-xs font-bold tracking-[0.16em] text-white/80 uppercase">
              Dein Fokus-Anime
            </p>
            <h2
              id="hero-title"
              className="mt-1 font-display text-[2.25rem] leading-[0.95] font-bold text-balance text-white uppercase sm:text-5xl"
            >
              {anime.title}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/anime/${anime.slug}`}
                className={buttonVariants({ size: "lg" })}
              >
                Zur Serie
              </Link>
              {latest && (
                <Link
                  href={episodeHref(anime.slug, latest)}
                  className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                    className:
                      "border-white/25 bg-black/35 text-white hover:bg-black/55 hover:text-white dark:bg-black/35",
                  })}
                >
                  Letzte Folge diskutieren
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
          {upcoming ? (
            <>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-brand uppercase">
                  <CalendarClockIcon className="size-4" aria-hidden="true" />
                  Nächste Folge
                </p>
                <p className="mt-2 font-display text-3xl leading-none font-bold">
                  Episode {upcoming.number}
                </p>
                {upcoming.title && (
                  <p className="mt-1.5 font-semibold text-balance">
                    „{upcoming.title}“
                  </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(upcoming.airTime)} Uhr
                </p>
              </div>
              <Countdown target={upcoming.airTime} />
              <p className="text-xs text-muted-foreground">
                Termin aus Demo-Daten
              </p>
            </>
          ) : (
            <EmptyState
              compact
              icon={CalendarDaysIcon}
              title="Kein Termin bekannt"
              description="Für diese Serie ist aktuell keine neue Folge angekündigt."
            />
          )}
        </div>
      </div>
    </section>
  );
}

function UpcomingList({ schedules }: { schedules: AnimeSchedule[] }) {
  const upcoming = schedules
    .filter((entry) => entry.upcoming)
    .toSorted((a, b) => a.upcoming!.airTime - b.upcoming!.airTime);

  return (
    <Section
      title="Kommende Episoden"
      description="Neue Folgen deiner Favoriten"
    >
      {upcoming.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarDaysIcon}
          title="Keine Termine in Sicht"
          description="Keiner deiner Favoriten hat gerade eine angekündigte Folge. Laufende Serien findest du unter Entdecken."
          action={{ label: "Laufende Serien", href: "/anime?status=airing" }}
        />
      ) : (
        <Panel>
          <ul className="divide-y">
            {upcoming.map(({ anime, upcoming: episode }) => (
              <li key={anime.id}>
                <Link
                  href={`/anime/${anime.slug}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-accent"
                >
                  <AnimeCover
                    anime={anime}
                    className="w-11 shrink-0 rounded-sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {anime.title}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      Episode {episode!.number}
                      {episode!.title && ` · ${episode!.title}`}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDateTime(episode!.airTime)} Uhr
                    </span>
                  </span>
                  <CountdownBadge target={episode!.airTime} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </Section>
  );
}

function DiscussionList({ schedules }: { schedules: AnimeSchedule[] }) {
  const counts = useEpisodeCommentCounts();
  const { watchedEpisodeIds, preferences } = useDemoState();
  const latest = schedules
    .filter((entry) => entry.latest?.title)
    .toSorted((a, b) => b.latest!.airTime - a.latest!.airTime);

  return (
    <Section
      title="Episodendiskussionen"
      description="Die neuesten Folgen deiner Serien"
    >
      {latest.length === 0 ? (
        <EmptyState
          compact
          icon={MessagesSquareIcon}
          title="Noch keine Diskussionen"
          description="Sobald eine deiner Serien eine neue Folge hat, erscheint hier die Diskussion."
          action={{ label: "Community ansehen", href: "/community" }}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {latest.map(({ anime, latest: episode }) => {
            const watched = watchedEpisodeIds.includes(episode!.id);
            const comments = counts.get(episode!.id) ?? 0;
            return (
              <li key={anime.id}>
                <Panel as="article" className="flex h-full gap-4 p-4">
                  <AnimeCover
                    anime={anime}
                    variant={episode!.number}
                    className="w-20 shrink-0 self-start"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-xs font-semibold text-muted-foreground">
                      {anime.title}
                    </p>
                    <h3 className="mt-0.5 text-[0.9375rem] leading-snug font-bold">
                      Episode {episode!.number} – {episode!.title}
                    </h3>
                    <SpoilerGuard
                      active={preferences.spoilerProtection && !watched}
                      reason="Inhalt"
                      className="mt-1.5"
                    >
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {episode!.synopsis}
                      </p>
                    </SpoilerGuard>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                      <Link
                        href={episodeHref(anime.slug, episode!)}
                        className={buttonVariants({ size: "sm" })}
                      >
                        Zur Diskussion
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatCount(comments)}{" "}
                        {comments === 1 ? "Kommentar" : "Kommentare"}
                      </span>
                    </div>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function FavoritesRow({ favorites }: { favorites: Anime[] }) {
  return (
    <Section title="Meine Favoriten" href="/my-anime">
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-5 xl:grid-cols-6">
        {favorites.map((anime) => (
          <li
            key={anime.id}
            className="w-[38vw] max-w-40 shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <AnimeCard anime={anime} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function NewUserStart() {
  const popular = listAnimeSync({ sort: "popular" }).slice(0, 6);
  return (
    <Panel as="section" labelledBy="start-title" className="overflow-hidden">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
        <div>
          <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <SparklesIcon className="size-5" aria-hidden="true" />
          </span>
          <h2 id="start-title" className="mt-4 text-xl font-bold text-balance">
            Stell dein Dashboard zusammen
          </h2>
          <p className="mt-2 text-muted-foreground">
            Favorisiere ein paar Serien. Danach siehst du hier kommende Folgen,
            Countdowns und passende Episodendiskussionen.
          </p>
          <Link href="/anime" className={buttonVariants({ className: "mt-5" })}>
            <CompassIcon aria-hidden="true" />
            Alle Anime entdecken
          </Link>
        </div>
        <ul
          className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6"
          aria-label="Beliebte Anime zum Favorisieren"
        >
          {popular.map((anime) => (
            <li key={anime.id} className="relative">
              <Link
                href={`/anime/${anime.slug}`}
                className="block rounded-lg"
                aria-label={anime.title}
              >
                <AnimeCover anime={anime} showTitle />
              </Link>
              <FavoriteToggle
                anime={anime}
                className="absolute top-1.5 right-1.5"
              />
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label="Dashboard wird geladen"
    >
      <Skeleton className="h-[19rem] rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] w-40 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function DashboardView() {
  const { viewer, hydrated } = useViewer();
  const { now } = useClock();
  const favorites = useMemo(
    () =>
      (viewer?.favoriteAnimeIds ?? [])
        .map((id) => getAnimeByIdSync(id))
        .filter((anime): anime is Anime => anime !== undefined),
    [viewer],
  );
  const schedules = useSchedules(favorites);
  // Fokus: die nächste anstehende Folge, sonst der erste Favorit.
  const focus =
    schedules
      .filter((entry) => entry.upcoming)
      .toSorted((a, b) => a.upcoming!.airTime - b.upcoming!.airTime)[0] ??
    schedules[0];

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-[1.75rem]">
              {!hydrated ? (
                "Dashboard"
              ) : viewer ? (
                <>
                  {greeting(now)},{" "}
                  <span className="text-brand">{viewer.displayName}</span>
                </>
              ) : (
                "Willkommen bei ANIMORA"
              )}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {viewer || !hydrated
                ? "Deine Serien, kommende Folgen und was die Community gerade bespricht."
                : "Melde dich an, um Favoriten zu speichern und dein Dashboard zu personalisieren."}
            </p>
          </header>

          {hydrated && viewer && !viewer.profileComplete && (
            <div
              role="status"
              className="flex flex-wrap items-center gap-3 rounded-lg border border-brand/30 bg-brand-soft px-4 py-3"
            >
              <UserRoundPenIcon
                className="size-5 shrink-0 text-brand"
                aria-hidden="true"
              />
              <p className="min-w-0 flex-1 text-sm">
                <span className="font-semibold">
                  Dein Profil ist noch nicht vollständig.
                </span>{" "}
                Wähle Avatar und Lieblings-Anime, damit dein Dashboard zu dir
                passt.
              </p>
              <Link
                href="/onboarding"
                className={buttonVariants({ size: "sm" })}
              >
                Profil einrichten
              </Link>
            </div>
          )}

          {!hydrated ? (
            <DashboardSkeleton />
          ) : !viewer ? (
            <EmptyState
              icon={LogInIcon}
              title="Dein persönliches Dashboard"
              description="Mit einem Konto siehst du hier deine Favoriten, Countdowns zu neuen Folgen und passende Diskussionen."
              action={{
                label: "Mit Demo-Konto anmelden",
                onClick: () => demoActions.signIn(),
              }}
              secondaryAction={{ label: "Anime entdecken", href: "/anime" }}
            />
          ) : favorites.length === 0 ? (
            <NewUserStart />
          ) : (
            <>
              {focus && <HeroFeature schedule={focus} />}
              <UpcomingList schedules={schedules} />
              <DiscussionList schedules={schedules} />
              <FavoritesRow favorites={favorites} />
            </>
          )}
        </div>

        <aside className="space-y-4" aria-label="Community">
          <PopularPostsPanel />
          <SuggestedUsersPanel />
        </aside>
      </div>
    </PageContainer>
  );
}
