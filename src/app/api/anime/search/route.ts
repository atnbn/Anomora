import { NextResponse, type NextRequest } from "next/server";
import type { AnimeSort, AnimeStatus } from "@/features/anime/types";
import { GENRE_OPTIONS } from "@/features/anime/genres";
import { AniListError, searchAniList } from "@/lib/anime-api/anilist";

const STATUSES: AnimeStatus[] = ["airing", "finished", "upcoming", "hiatus"];
const SORTS: AnimeSort[] = ["popular", "score", "newest", "title"];

/**
 * Anime-Suche über AniList.
 *
 * GET mit Query-Parametern, damit das CDN Antworten pro URL zwischenspeichern
 * kann (`s-maxage`). Zusammen mit `use cache` in `searchAniList` und dem
 * Browser-Cache wird dieselbe Suche nur selten wirklich an AniList geschickt.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const search = query.get("search")?.trim().slice(0, 100) || undefined;
  const genre = query.get("genre") ?? undefined;
  const status = query.get("status") as AnimeStatus | null;
  const sort = query.get("sort") as AnimeSort | null;
  const page = Number(query.get("page") ?? "1");

  if (
    (genre &&
      !GENRE_OPTIONS.includes(genre as (typeof GENRE_OPTIONS)[number])) ||
    (status && !STATUSES.includes(status)) ||
    (sort && !SORTS.includes(sort)) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 20
  ) {
    return NextResponse.json(
      { error: "Ungültige Suchparameter." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await searchAniList({
      search,
      genre,
      status: status ?? undefined,
      sort: sort ?? undefined,
      page,
    });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": search
          ? "public, s-maxage=3600, stale-while-revalidate=86400"
          : "public, s-maxage=21600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const rateLimited = error instanceof AniListError && error.status === 429;
    console.error("[anilist] Suche fehlgeschlagen:", (error as Error).message);
    return NextResponse.json(
      {
        error: rateLimited
          ? "AniList ist gerade ausgelastet. Bitte versuche es in einer Minute erneut."
          : "AniList ist gerade nicht erreichbar. Bitte versuche es später erneut.",
      },
      {
        status: rateLimited ? 503 : 502,
        headers: {
          "Cache-Control": "no-store",
          ...(rateLimited
            ? {
                "Retry-After": String((error as AniListError).retryAfter ?? 60),
              }
            : {}),
        },
      },
    );
  }
}
