"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckIcon,
  MessageCircleIcon,
  SearchXIcon,
  TvIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import type { Anime } from "@/features/anime/types";
import { CountdownBadge } from "@/features/anime/components/countdown";
import { useTimedEpisodes } from "@/features/anime/episode-timeline";
import { episodeHref } from "@/features/anime/labels";
import { useEpisodeCommentCounts } from "@/features/community/hooks";
import {
  demoActions,
  requireSession,
  useDemoState,
} from "@/features/demo/store";
import { useClock } from "@/features/demo/clock";
import { getEpisodesSync } from "@/lib/data/anime";
import { formatCount, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;
const RECENT_MS = 1000 * 60 * 60 * 24 * 60;

/** Episodenübersicht mit Suche nach Nummer, Sortierung, „Gesehen“-Status und Nachladen. */
export function EpisodeList({ anime }: { anime: Anime }) {
  const raw = useMemo(() => getEpisodesSync(anime.id), [anime.id]);
  const episodes = useTimedEpisodes(raw);
  const { now } = useClock();
  const { watchedEpisodeIds, session } = useDemoState();
  const counts = useEpisodeCommentCounts();
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("de");
    const list = term
      ? episodes.filter(
          (episode) =>
            String(episode.number).startsWith(term) ||
            episode.title?.toLocaleLowerCase("de").includes(term),
        )
      : episodes;
    return order === "desc" ? list.toReversed() : list;
  }, [episodes, order, query]);

  if (episodes.length === 0) {
    return (
      <EmptyState
        icon={TvIcon}
        title="Noch keine Episoden"
        description={
          anime.status === "upcoming"
            ? "Diese Serie ist angekündigt. Episoden erscheinen hier, sobald sie ausgestrahlt werden."
            : "Für diese Serie liegen noch keine Episodendaten vor."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-0 flex-1 gap-1">
          <label
            htmlFor="episode-search"
            className="text-xs font-semibold text-muted-foreground"
          >
            Episode suchen
          </label>
          <input
            id="episode-search"
            type="search"
            inputMode="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Nummer oder Titel"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 sm:max-w-xs"
          />
        </div>
        <div className="grid gap-1">
          <label
            htmlFor="episode-order"
            className="text-xs font-semibold text-muted-foreground"
          >
            Reihenfolge
          </label>
          <select
            id="episode-order"
            value={order}
            onChange={(event) => setOrder(event.target.value as "asc" | "desc")}
            className="h-10 rounded-md border bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <option value="desc">Neueste zuerst</option>
            <option value="asc">Älteste zuerst</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {formatCount(filtered.length)}{" "}
        {filtered.length === 1 ? "Episode" : "Episoden"} ·{" "}
        {anime.source === "anilist"
          ? "Termine und Titel laut AniList, soweit bekannt"
          : "Titel und Termine sind Demo-Daten"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={SearchXIcon}
          title={`Keine Episode zu „${query.trim()}“`}
          description="Suche nach einer Episodennummer wie „12“ oder einem Wort aus dem Titel."
          action={{ label: "Suche zurücksetzen", onClick: () => setQuery("") }}
        />
      ) : (
        <ol className="divide-y overflow-hidden rounded-lg border bg-card">
          {filtered.slice(0, visible).map((episode) => {
            const watched = watchedEpisodeIds.includes(episode.id);
            const comments = counts.get(episode.id) ?? 0;
            const recent = Math.abs(episode.airTime - now) < RECENT_MS;
            return (
              <li
                key={episode.id}
                className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-md bg-muted font-display text-lg font-bold tabular",
                    watched && "bg-brand-soft text-brand",
                  )}
                  aria-hidden="true"
                >
                  {episode.number}
                </span>
                <div className="min-w-0 flex-1">
                  {episode.aired ? (
                    <Link
                      href={episodeHref(anime.slug, episode)}
                      className="block truncate text-sm font-semibold hover:text-brand hover:underline"
                    >
                      <span className="sr-only">
                        Episode {episode.number}:{" "}
                      </span>
                      {episode.title ?? `Episode ${episode.number}`}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-semibold">
                      <span className="sr-only">
                        Episode {episode.number}:{" "}
                      </span>
                      {episode.title ?? `Episode ${episode.number}`}
                    </p>
                  )}
                  <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                    {recent && <span>{formatDateShort(episode.airTime)}</span>}
                    <span>{episode.durationMinutes} Min.</span>
                    {comments > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <MessageCircleIcon
                          className="size-3"
                          aria-hidden="true"
                        />
                        {formatCount(comments)}
                        <span className="sr-only">Kommentare</span>
                      </span>
                    )}
                  </p>
                </div>
                {episode.aired ? (
                  <button
                    type="button"
                    aria-pressed={watched}
                    aria-label={
                      watched
                        ? `Episode ${episode.number} als nicht gesehen markieren`
                        : `Episode ${episode.number} als gesehen markieren`
                    }
                    onClick={() => {
                      if (
                        requireSession(
                          "Melde dich an, um deinen Fortschritt zu speichern.",
                        )
                      ) {
                        demoActions.toggleWatched(episode.id);
                      }
                    }}
                    className={cn(
                      "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors hover:bg-accent",
                      watched &&
                        session &&
                        "border-transparent bg-brand-soft text-brand hover:bg-brand-soft",
                    )}
                  >
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                    <span className="max-sm:sr-only">
                      {watched && session ? "Gesehen" : "Gesehen?"}
                    </span>
                  </button>
                ) : (
                  <CountdownBadge target={episode.airTime} />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {filtered.length > visible && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setVisible((value) => value + PAGE_SIZE)}
        >
          Weitere {Math.min(PAGE_SIZE, filtered.length - visible)} Episoden
          laden
        </Button>
      )}
    </div>
  );
}
