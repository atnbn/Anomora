import type {
  AiringSlot,
  Anime,
  AnimeSort,
  AnimeStatus,
} from "@/features/anime/types";
import { genreToGerman } from "@/features/anime/genres";

/** Felder, die ANIMORA von einem AniList-Medium abfragt. */
export const MEDIA_FIELDS = /* GraphQL */ `
  id
  siteUrl
  title { romaji english native }
  description(asHtml: false)
  seasonYear
  startDate { year }
  status
  format
  episodes
  averageScore
  genres
  studios(isMain: true) { nodes { name } }
  coverImage { extraLarge large color }
  bannerImage
  nextAiringEpisode { episode airingAt }
`;

export type AniListMedia = {
  id: number;
  siteUrl: string;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  seasonYear: number | null;
  startDate: { year: number | null } | null;
  status:
    "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";
  format: string | null;
  episodes: number | null;
  averageScore: number | null;
  genres: string[];
  studios: { nodes: { name: string }[] };
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    color: string | null;
  };
  bannerImage: string | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  streamingEpisodes?: { title: string | null }[];
};

export type AniListAiring = {
  mediaId: number;
  episode: number;
  airingAt: number;
};

const statusMap: Record<AniListMedia["status"], AnimeStatus> = {
  FINISHED: "finished",
  RELEASING: "airing",
  NOT_YET_RELEASED: "upcoming",
  CANCELLED: "finished",
  HIATUS: "hiatus",
};

export const sortMap: Record<AnimeSort, string> = {
  popular: "POPULARITY_DESC",
  score: "SCORE_DESC",
  newest: "START_DATE_DESC",
  title: "TITLE_ROMAJI",
};

export const statusFilterMap: Record<AnimeStatus, AniListMedia["status"]> = {
  airing: "RELEASING",
  finished: "FINISHED",
  upcoming: "NOT_YET_RELEASED",
  hiatus: "HIATUS",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function anilistSlug(id: number, title: string) {
  const suffix = slugify(title);
  return suffix ? `${id}-${suffix}` : String(id);
}

/** AniList-ID aus einem Slug wie „21-one-piece“. */
export function anilistIdFromSlug(slug: string): number | undefined {
  const match = /^(\d+)(?:-|$)/.exec(slug);
  return match ? Number(match[1]) : undefined;
}

function cleanDescription(text: string | null) {
  return (text ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\(Source:[^)]*\)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** „Episode 12 - Titel“ aus den Streaming-Angaben in eine Nummer→Titel-Liste. */
function parseEpisodeTitles(
  media: AniListMedia,
): Record<number, string> | undefined {
  const titles: Record<number, string> = {};
  for (const entry of media.streamingEpisodes ?? []) {
    const match = /^Episode\s+(\d+)\s*[-–:]\s*(.+)$/i.exec(entry.title ?? "");
    if (match) titles[Number(match[1])] = match[2].trim();
  }
  return Object.keys(titles).length > 0 ? titles : undefined;
}

function airedCount(media: AniListMedia, airing: AiringSlot[]): number {
  if (media.nextAiringEpisode)
    return Math.max(0, media.nextAiringEpisode.episode - 1);
  if (media.status === "NOT_YET_RELEASED") return 0;
  const lastAired = airing
    .filter((slot) => slot.airingAt <= Date.now())
    .reduce((max, slot) => Math.max(max, slot.episode), 0);
  return media.episodes ?? lastAired;
}

/** Wandelt ein AniList-Medium in das ANIMORA-Format um. */
export function mapAniListMedia(
  media: AniListMedia,
  airingNodes: AniListAiring[] = [],
): Anime {
  const title =
    media.title.english ??
    media.title.romaji ??
    media.title.native ??
    "Ohne Titel";
  const airing = airingNodes
    .filter((node) => node.mediaId === media.id)
    .map((node) => ({ episode: node.episode, airingAt: node.airingAt * 1000 }))
    .toSorted((a, b) => a.episode - b.episode);

  return {
    id: `anilist-${media.id}`,
    slug: anilistSlug(media.id, title),
    title,
    originalTitle:
      media.title.romaji && media.title.romaji !== title
        ? media.title.romaji
        : undefined,
    synopsis: cleanDescription(media.description),
    synopsisLanguage: "en",
    year: media.seasonYear ?? media.startDate?.year ?? 0,
    studio: media.studios.nodes[0]?.name ?? "Unbekannt",
    status: statusMap[media.status],
    genres: media.genres.map(genreToGerman),
    episodeCount: airedCount(media, airing),
    score: media.averageScore ?? 0,
    coverUrl:
      media.coverImage.extraLarge ?? media.coverImage.large ?? undefined,
    coverColor: media.coverImage.color ?? undefined,
    bannerUrl: media.bannerImage ?? undefined,
    source: "anilist",
    anilistId: media.id,
    siteUrl: media.siteUrl,
    nextAiring: media.nextAiringEpisode
      ? {
          episode: media.nextAiringEpisode.episode,
          airingAt: media.nextAiringEpisode.airingAt * 1000,
        }
      : undefined,
    airing: airing.length > 0 ? airing : undefined,
    episodeTitles: parseEpisodeTitles(media),
  };
}

/**
 * Verbindet einen kuratierten Eintrag mit Live-Daten: deutsche Titel,
 * Beschreibung, Slug, ID und Demo-Artwork bleiben, alles Messbare kommt von AniList.
 */
export function mergeCurated(curated: Anime, live: Anime): Anime {
  return {
    ...live,
    id: curated.id,
    slug: curated.slug,
    title: curated.title,
    originalTitle: live.originalTitle ?? curated.originalTitle,
    synopsis: curated.synopsis,
    synopsisLanguage: "de",
    art: curated.art,
  };
}
