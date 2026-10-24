import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { Anime, AnimeSort, AnimeStatus } from "@/features/anime/types";
import { genreToAniList } from "@/features/anime/genres";
import { demoAnime } from "@/data/demo/anime";
import {
  type AniListAiring,
  type AniListMedia,
  MEDIA_FIELDS,
  mapAniListMedia,
  mergeCurated,
  sortMap,
  statusFilterMap,
} from "@/lib/anime-api/anilist-mapping";

/**
 * Serverseitiger Zugriff auf die AniList-GraphQL-API.
 *
 * API-Aufrufe sparen:
 * - Alle kuratierten Serien inkl. Termine kommen in EINER Anfrage.
 * - Jede Funktion ist mit `use cache` zwischengespeichert; Ergebnisse
 *   landen im vorgerenderten Seitengerüst und werden höchstens stündlich
 *   neu geholt. Fehler werden nur kurz gecacht (`minutes`), damit nach
 *   einem Ausfall bald ein neuer Versuch erfolgt.
 * - AniList erlaubt derzeit 30 Anfragen pro Minute; bei 429 wird nicht
 *   wiederholt, sondern auf Demo-Daten bzw. eine Fehlermeldung ausgewichen.
 */

const ENDPOINT = "https://graphql.anilist.co";
const TIMEOUT_MS = 8000;
const DAY_S = 24 * 60 * 60;

export class AniListError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

async function request<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  // Jede echte Anfrage wird protokolliert – so lässt sich prüfen, dass Caches greifen.
  console.info(
    `[anilist] Anfrage ${/query (\w+)/.exec(query)?.[1] ?? "?"}`,
    JSON.stringify(variables).slice(0, 120),
  );
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) {
    const retryAfter = Number(response.headers.get("Retry-After")) || undefined;
    throw new AniListError(
      `AniList antwortet mit ${response.status}`,
      response.status,
      retryAfter,
    );
  }
  const json = (await response.json()) as {
    data: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) throw new AniListError(json.errors[0].message, 400);
  return json.data;
}

const curatedIds = demoAnime
  .map((anime) => anime.anilistId)
  .filter((id): id is number => typeof id === "number");

const CATALOG_QUERY = /* GraphQL */ `
  query Catalog($ids: [Int], $from: Int, $to: Int) {
    catalog: Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        ${MEDIA_FIELDS}
        streamingEpisodes { title }
      }
    }
    schedule: Page(perPage: 50) {
      airingSchedules(mediaId_in: $ids, airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
        mediaId
        episode
        airingAt
      }
    }
  }
`;

type CatalogResult = {
  catalog: { media: AniListMedia[] };
  schedule: { airingSchedules: AniListAiring[] };
};

export type LiveCatalog = {
  items: Anime[];
  /** Abrufzeitpunkt in ms – dient beim Rendern als Uhrzeit (siehe features/demo/clock). */
  fetchedAt: number;
};

/** Kuratierter Katalog mit Live-Daten. `null`, wenn AniList nicht erreichbar ist. */
export async function getLiveCatalog(): Promise<LiveCatalog | null> {
  "use cache";
  cacheTag("anilist", "anilist-catalog");
  const nowS = Math.floor(Date.now() / 1000);
  try {
    const data = await request<CatalogResult>(CATALOG_QUERY, {
      ids: curatedIds,
      from: nowS - 60 * DAY_S,
      to: nowS + 30 * DAY_S,
    });
    cacheLife("hours");
    const nodes = data.schedule.airingSchedules;
    const items = demoAnime.flatMap((curated) => {
      const media = data.catalog.media.find(
        (entry) => entry.id === curated.anilistId,
      );
      return media
        ? [mergeCurated(curated, mapAniListMedia(media, nodes))]
        : [];
    });
    return { items, fetchedAt: nowS * 1000 };
  } catch (error) {
    console.error("[anilist] Katalog nicht geladen:", (error as Error).message);
    cacheLife("minutes");
    return null;
  }
}

const MEDIA_QUERY = /* GraphQL */ `
  query Media($id: Int, $from: Int, $to: Int) {
    Media(id: $id, type: ANIME, isAdult: false) {
      ${MEDIA_FIELDS}
      streamingEpisodes { title }
    }
    schedule: Page(perPage: 50) {
      airingSchedules(mediaId: $id, airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
        mediaId
        episode
        airingAt
      }
    }
  }
`;

/** Ein beliebiger Anime per AniList-ID; kuratierte Serien kommen aus dem Katalog. */
export async function getAniListAnime(id: number): Promise<Anime | null> {
  const curated = demoAnime.find((anime) => anime.anilistId === id);
  if (curated) {
    const catalog = await getLiveCatalog();
    return catalog?.items.find((anime) => anime.id === curated.id) ?? null;
  }
  return fetchAnimeById(id);
}

async function fetchAnimeById(id: number): Promise<Anime | null> {
  "use cache";
  cacheTag("anilist", `anilist-media-${id}`);
  const nowS = Math.floor(Date.now() / 1000);
  try {
    const data = await request<{
      Media: AniListMedia | null;
      schedule: { airingSchedules: AniListAiring[] };
    }>(MEDIA_QUERY, { id, from: nowS - 60 * DAY_S, to: nowS + 30 * DAY_S });
    cacheLife("hours");
    return data.Media
      ? mapAniListMedia(data.Media, data.schedule.airingSchedules)
      : null;
  } catch (error) {
    // 404 bedeutet: gibt es nicht – das darf lange gecacht werden.
    if (error instanceof AniListError && error.status === 404) {
      cacheLife("days");
      return null;
    }
    cacheLife("minutes");
    throw error;
  }
}

export type AnimeSearchParams = {
  search?: string;
  genre?: string;
  status?: AnimeStatus;
  sort?: AnimeSort;
  page?: number;
};

export type AnimeSearchResult = {
  items: Anime[];
  page: number;
  hasNextPage: boolean;
  total: number;
};

const SEARCH_QUERY = /* GraphQL */ `
  query Search($search: String, $genre: String, $status: MediaStatus, $sort: [MediaSort], $page: Int) {
    Page(page: $page, perPage: 24) {
      pageInfo { currentPage hasNextPage total }
      media(search: $search, genre: $genre, status: $status, sort: $sort, type: ANIME, isAdult: false) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

/** Suche/Liste bei AniList. Wirft `AniListError`, damit die Route richtig antworten kann. */
export async function searchAniList(
  params: AnimeSearchParams,
): Promise<AnimeSearchResult> {
  "use cache";
  cacheTag("anilist", "anilist-search");
  const search = params.search?.trim() || undefined;
  const data = await request<{
    Page: {
      pageInfo: { currentPage: number; hasNextPage: boolean; total: number };
      media: AniListMedia[];
    };
  }>(SEARCH_QUERY, {
    search,
    genre: params.genre ? genreToAniList(params.genre) : undefined,
    status: params.status ? statusFilterMap[params.status] : undefined,
    // Bei einer Textsuche ist Relevanz wichtiger als die gewählte Sortierung.
    sort: search
      ? ["SEARCH_MATCH", sortMap[params.sort ?? "popular"]]
      : [sortMap[params.sort ?? "popular"]],
    page: params.page ?? 1,
  });
  // Textsuchen ändern sich häufiger als allgemeine Listen.
  if (search) cacheLife("hours");
  else cacheLife("days");

  // Kuratierte Treffer zeigen die deutsche Fassung mit eigener Detailseite.
  const catalog = await getLiveCatalog();
  const items = data.Page.media.map((media) => {
    const curated = catalog?.items.find(
      (anime) => anime.anilistId === media.id,
    );
    return curated ?? mapAniListMedia(media);
  });
  return {
    items,
    page: data.Page.pageInfo.currentPage,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    total: data.Page.pageInfo.total,
  };
}
