import type { Anime, AnimeSort, Episode } from "@/features/anime/types";
import { demoAnime } from "@/data/demo/anime";
import { demoEpisodes } from "@/data/demo/episodes";
import { getLiveAnime, getLiveAnimeBySlug } from "@/lib/data/live-registry";

/**
 * Synchroner Datenzugriff für Anime und Episoden (Server und Browser).
 *
 * Reihenfolge: Live-Daten von AniList aus dem Register (siehe
 * `live-registry.ts`), sonst der kuratierte Demo-Katalog. Asynchrone
 * Server-Funktionen, die AniList selbst abfragen, liegen in `anime-server.ts`.
 */

export type AnimeQuery = {
  search?: string;
  genre?: string;
  status?: Anime["status"];
  sort?: AnimeSort;
};

/** Kuratierter Katalog – mit Live-Daten, sobald sie geladen sind. */
export function getCatalogSync(): Anime[] {
  return demoAnime.map((anime) => getLiveAnime(anime.id) ?? anime);
}

export function listAnimeSync(query: AnimeQuery = {}): Anime[] {
  const search = query.search?.trim().toLocaleLowerCase("de");
  const result = getCatalogSync().filter((anime) => {
    if (search) {
      const haystack = [
        anime.title,
        anime.originalTitle ?? "",
        anime.studio,
        ...anime.genres,
      ]
        .join(" ")
        .toLocaleLowerCase("de");
      if (!haystack.includes(search)) return false;
    }
    if (query.genre && !anime.genres.includes(query.genre)) return false;
    if (query.status && anime.status !== query.status) return false;
    return true;
  });

  const sort = query.sort ?? "popular";
  return result.toSorted((a, b) => {
    switch (sort) {
      case "score":
        return b.score - a.score;
      case "newest":
        return b.year - a.year;
      case "title":
        return a.title.localeCompare(b.title, "de");
      default:
        return (
          b.score + b.episodeCount / 100 - (a.score + a.episodeCount / 100)
        );
    }
  });
}

export function getAnimeByIdSync(id: string): Anime | undefined {
  return getLiveAnime(id) ?? demoAnime.find((anime) => anime.id === id);
}

export function getAnimeBySlugSync(slug: string): Anime | undefined {
  const curated = demoAnime.find((anime) => anime.slug === slug);
  if (curated) return getLiveAnime(curated.id) ?? curated;
  return getLiveAnimeBySlug(slug);
}

export function getAllAnimeSlugs(): string[] {
  return demoAnime.map((anime) => anime.slug);
}

const liveEpisodeCache = new WeakMap<Anime, Episode[]>();

/** Episodenliste aus AniList-Daten: Anzahl, bekannte Termine und Titel. */
function buildLiveEpisodes(anime: Anime): Episode[] {
  const cached = liveEpisodeCache.get(anime);
  if (cached) return cached;

  const upcoming =
    anime.nextAiring && anime.nextAiring.episode > anime.episodeCount
      ? anime.nextAiring
      : undefined;
  const last = upcoming ? upcoming.episode : anime.episodeCount;
  const slots = new Map(
    (anime.airing ?? []).map((slot) => [slot.episode, slot.airingAt]),
  );
  if (upcoming) slots.set(upcoming.episode, upcoming.airingAt);

  const episodes = Array.from({ length: last }, (_, index): Episode => {
    const number = index + 1;
    const airingAt = slots.get(number);
    return {
      id: `${anime.slug}-${number}`,
      animeId: anime.id,
      number,
      title: anime.episodeTitles?.[number],
      airDate: airingAt ? new Date(airingAt).toISOString() : undefined,
      durationMinutes: 24,
      live: true,
    };
  });
  liveEpisodeCache.set(anime, episodes);
  return episodes;
}

export function getEpisodesSync(animeId: string): Episode[] {
  const anime = getAnimeByIdSync(animeId);
  if (anime?.source === "anilist") return buildLiveEpisodes(anime);
  return demoEpisodes.filter((episode) => episode.animeId === animeId);
}

export function getEpisodeFromList(
  anime: Anime,
  number: number,
):
  | { anime: Anime; episode: Episode; previous?: Episode; next?: Episode }
  | undefined {
  const episodes =
    anime.source === "anilist"
      ? buildLiveEpisodes(anime)
      : demoEpisodes.filter((episode) => episode.animeId === anime.id);
  const index = episodes.findIndex((episode) => episode.number === number);
  if (index === -1) return undefined;
  return {
    anime,
    episode: episodes[index],
    previous: episodes[index - 1],
    next: episodes[index + 1],
  };
}

/** Episoden-IDs haben die Form `${slug}-${nummer}`. */
export function getEpisodeByIdSync(id: string): Episode | undefined {
  const match = /^(.*)-(\d+)$/.exec(id);
  if (!match) return undefined;
  const anime = getAnimeBySlugSync(match[1]);
  if (!anime) return undefined;
  return getEpisodeFromList(anime, Number(match[2]))?.episode;
}

/**
 * Beispielhafte Episodenseiten für die Vorab-Generierung: jeweils Folge 1.
 * Die übrigen Episoden werden bei Bedarf gerendert.
 */
export function getFeaturedEpisodeParams(): { slug: string; number: string }[] {
  return demoAnime
    .filter((anime) => anime.episodeCount > 0)
    .map((anime) => ({ slug: anime.slug, number: "1" }));
}
