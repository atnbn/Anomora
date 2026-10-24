"use client";

import { useMemo } from "react";
import type { Anime, Episode } from "@/features/anime/types";
import { type Clock, useClock } from "@/features/demo/clock";
import { getEpisodesSync } from "@/lib/data/anime";

export type TimedEpisode = Episode & {
  /** Ausstrahlung in ms; 0, wenn kein Termin bekannt ist (gilt als erschienen). */
  airTime: number;
  aired: boolean;
};

/**
 * Demo-Episoden werden mit der Uhr verschoben, damit Termine aktuell bleiben;
 * echte AniList-Termine (`live`) bleiben unverändert.
 */
export function timeEpisode(episode: Episode, clock: Clock): TimedEpisode {
  if (!episode.airDate) return { ...episode, airTime: 0, aired: true };
  const airTime =
    Date.parse(episode.airDate) + (episode.live ? 0 : clock.shift);
  return { ...episode, airTime, aired: airTime <= clock.now };
}

export function useTimedEpisodes(episodes: Episode[]): TimedEpisode[] {
  const clock = useClock();
  return useMemo(
    () => episodes.map((episode) => timeEpisode(episode, clock)),
    [episodes, clock],
  );
}

export type AnimeSchedule = {
  anime: Anime;
  latest?: TimedEpisode;
  upcoming?: TimedEpisode;
};

/** Neueste erschienene und nächste Episode je Anime. */
export function useSchedules(animeList: Anime[]): AnimeSchedule[] {
  const clock = useClock();
  return useMemo(
    () =>
      animeList.map((anime) => {
        const episodes = getEpisodesSync(anime.id);
        let latest: TimedEpisode | undefined;
        let upcoming: TimedEpisode | undefined;
        // Nur die letzten Einträge sind relevant; die Liste ist nach Nummer sortiert.
        for (const episode of episodes.slice(-10)) {
          const timed = timeEpisode(episode, clock);
          if (timed.aired) latest = timed;
          else if (!upcoming) upcoming = timed;
        }
        return { anime, latest, upcoming };
      }),
    [animeList, clock],
  );
}
