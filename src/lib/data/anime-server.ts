import "server-only";

import type { Anime, Episode } from "@/features/anime/types";
import { demoAnime } from "@/data/demo/anime";
import { getAniListAnime, getLiveCatalog } from "@/lib/anime-api/anilist";
import { anilistIdFromSlug } from "@/lib/anime-api/anilist-mapping";
import { getEpisodeFromList } from "@/lib/data/anime";
import { registerLiveAnime } from "@/lib/data/live-registry";

/**
 * Asynchrone Server-Zugriffe. Kuratierte Serien kommen aus dem gecachten
 * AniList-Katalog (Fallback: Demo-Daten), alle anderen per AniList-ID.
 */

export async function getAnimeBySlug(slug: string): Promise<Anime | undefined> {
  const curated = demoAnime.find((anime) => anime.slug === slug);
  if (curated) {
    const catalog = await getLiveCatalog();
    if (catalog) registerLiveAnime(catalog.items);
    return catalog?.items.find((anime) => anime.id === curated.id) ?? curated;
  }

  const id = anilistIdFromSlug(slug);
  if (!id) return undefined;
  // Netzwerk- und Rate-Limit-Fehler gehen an die Fehlerseite (mit „Erneut versuchen“).
  const anime = await getAniListAnime(id);
  if (!anime) return undefined;
  registerLiveAnime([anime]);
  return anime;
}

export async function getEpisode(
  animeSlug: string,
  number: number,
): Promise<
  | { anime: Anime; episode: Episode; previous?: Episode; next?: Episode }
  | undefined
> {
  const anime = await getAnimeBySlug(animeSlug);
  return anime ? getEpisodeFromList(anime, number) : undefined;
}
