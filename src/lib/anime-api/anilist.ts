import type { Anime, AnimeStatus } from "@/features/anime/types";

/**
 * Vorbereiteter Adapter für die öffentliche AniList-GraphQL-API.
 *
 * Noch nicht aktiv: `src/lib/data/anime.ts` verwendet die Demo-Daten.
 * Vor der Aktivierung klären: Nutzungsbedingungen und Rate-Limits von AniList,
 * Bildrechte für Cover (Anzeige mit Quellenangabe), Caching mit `use cache`
 * und `cacheLife`, sowie eine Zuordnung von AniList-IDs zu eigenen Datensätzen
 * in Supabase (Favoriten, Diskussionen).
 */

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const SEARCH_QUERY = /* GraphQL */ `
  query ($search: String, $page: Int) {
    Page(page: $page, perPage: 24) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        seasonYear
        status
        episodes
        averageScore
        genres
        studios(isMain: true) {
          nodes {
            name
          }
        }
        coverImage {
          extraLarge
        }
      }
    }
  }
`;

type AniListMedia = {
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  seasonYear: number | null;
  status:
    "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
  episodes: number | null;
  averageScore: number | null;
  genres: string[];
  studios: { nodes: { name: string }[] };
  coverImage: { extraLarge: string | null };
};

const statusMap: Record<AniListMedia["status"], AnimeStatus> = {
  FINISHED: "finished",
  RELEASING: "airing",
  NOT_YET_RELEASED: "upcoming",
  CANCELLED: "finished",
  HIATUS: "hiatus",
};

export function mapAniListMedia(media: AniListMedia): Anime {
  const title =
    media.title.english ??
    media.title.romaji ??
    media.title.native ??
    "Unbenannt";
  return {
    id: `anilist-${media.id}`,
    slug: `${media.id}-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`,
    title,
    originalTitle: media.title.romaji ?? undefined,
    synopsis: (media.description ?? "").replace(/<[^>]+>/g, "").trim(),
    year: media.seasonYear ?? 0,
    studio: media.studios.nodes[0]?.name ?? "Unbekannt",
    status: statusMap[media.status],
    genres: media.genres,
    episodeCount: media.episodes ?? 0,
    score: media.averageScore ?? 0,
    coverUrl: media.coverImage.extraLarge ?? undefined,
  };
}

export async function searchAniList(
  search: string,
  page = 1,
): Promise<Anime[]> {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: SEARCH_QUERY, variables: { search, page } }),
  });

  if (!response.ok) {
    throw new Error(`AniList antwortet mit ${response.status}`);
  }

  const json = (await response.json()) as {
    data: { Page: { media: AniListMedia[] } };
  };
  return json.data.Page.media.map(mapAniListMedia);
}
