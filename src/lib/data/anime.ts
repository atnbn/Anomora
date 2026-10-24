import type { Anime, AnimeSort, Episode } from "@/features/anime/types";
import { demoAnime } from "@/data/demo/anime";
import { demoEpisodes } from "@/data/demo/episodes";

/**
 * Datenzugriff für Anime und Episoden.
 *
 * Aktuell liefert die Demo-Quelle alle Daten. Sobald eine Anime-API angebunden
 * ist (siehe `src/lib/anime-api/anilist.ts`), werden diese Funktionen gegen die
 * API implementiert – die Signaturen bleiben gleich, die UI ändert sich nicht.
 */

export type AnimeQuery = {
  search?: string;
  genre?: string;
  status?: Anime["status"];
  sort?: AnimeSort;
};

export function listAnimeSync(query: AnimeQuery = {}): Anime[] {
  const search = query.search?.trim().toLocaleLowerCase("de");
  const result = demoAnime.filter((anime) => {
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

export async function listAnime(query: AnimeQuery = {}): Promise<Anime[]> {
  return listAnimeSync(query);
}

export function getAllGenres(): string[] {
  return [...new Set(demoAnime.flatMap((anime) => anime.genres))].toSorted(
    (a, b) => a.localeCompare(b, "de"),
  );
}

export function getAnimeByIdSync(id: string): Anime | undefined {
  return demoAnime.find((anime) => anime.id === id);
}

export function getAnimeBySlugSync(slug: string): Anime | undefined {
  return demoAnime.find((anime) => anime.slug === slug);
}

export async function getAnimeBySlug(slug: string): Promise<Anime | undefined> {
  return getAnimeBySlugSync(slug);
}

export function getAllAnimeSlugs(): string[] {
  return demoAnime.map((anime) => anime.slug);
}

export function getEpisodesSync(animeId: string): Episode[] {
  return demoEpisodes.filter((episode) => episode.animeId === animeId);
}

export async function getEpisodes(animeId: string): Promise<Episode[]> {
  return getEpisodesSync(animeId);
}

export async function getEpisode(
  animeSlug: string,
  number: number,
): Promise<
  | { anime: Anime; episode: Episode; previous?: Episode; next?: Episode }
  | undefined
> {
  const anime = await getAnimeBySlug(animeSlug);
  if (!anime) return undefined;
  const episodes = getEpisodesSync(anime.id);
  const index = episodes.findIndex((episode) => episode.number === number);
  if (index === -1) return undefined;
  return {
    anime,
    episode: episodes[index],
    previous: episodes[index - 1],
    next: episodes[index + 1],
  };
}

export function getEpisodeByIdSync(id: string): Episode | undefined {
  return demoEpisodes.find((episode) => episode.id === id);
}

/** Episoden mit Diskussions-Seeds, für Sitemap und statische Vorab-Generierung. */
export function getFeaturedEpisodeParams(): { slug: string; number: string }[] {
  return demoAnime
    .filter((anime) => anime.status === "airing")
    .flatMap((anime) =>
      getEpisodesSync(anime.id)
        .slice(-7)
        .map((episode) => ({
          slug: anime.slug,
          number: String(episode.number),
        })),
    );
}
