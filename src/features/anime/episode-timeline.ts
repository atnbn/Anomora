"use client";

import { useMemo } from "react";
import type { Anime, Episode } from "@/features/anime/types";
import { useClock } from "@/features/demo/clock";
import { getEpisodesSync } from "@/lib/data/anime";

export type TimedEpisode = Episode & { airTime: number; aired: boolean };

/** Demo-Episoden werden mit der Uhr verschoben, damit Termine aktuell bleiben. */
export function useTimedEpisodes(episodes: Episode[]): TimedEpisode[] {
  const clock = useClock();
  return useMemo(
    () =>
      episodes.map((episode) => {
        const airTime = Date.parse(episode.airDate) + clock.shift;
        return { ...episode, airTime, aired: airTime <= clock.now };
      }),
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
          const airTime = Date.parse(episode.airDate) + clock.shift;
          const timed = { ...episode, airTime, aired: airTime <= clock.now };
          if (timed.aired) latest = timed;
          else if (!upcoming) upcoming = timed;
        }
        return { anime, latest, upcoming };
      }),
    [animeList, clock],
  );
}
