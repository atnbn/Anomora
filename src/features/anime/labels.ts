import type { AnimeSort, AnimeStatus, Episode } from "@/features/anime/types";

export const statusLabel: Record<AnimeStatus, string> = {
  airing: "Läuft",
  finished: "Abgeschlossen",
  upcoming: "Angekündigt",
  hiatus: "Pausiert",
};

export const sortLabel: Record<AnimeSort, string> = {
  popular: "Beliebtheit",
  score: "Bewertung",
  newest: "Neueste zuerst",
  title: "Titel A–Z",
};

export function episodeLabel(episode: Pick<Episode, "number" | "title">) {
  return episode.title
    ? `Episode ${episode.number} – ${episode.title}`
    : `Episode ${episode.number}`;
}

export function episodeHref(
  animeSlug: string,
  episode: Pick<Episode, "number">,
) {
  return `/anime/${animeSlug}/episodes/${episode.number}`;
}
