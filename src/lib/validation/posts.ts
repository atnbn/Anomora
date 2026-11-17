import type { PostCategory } from "@/features/community/types";

/**
 * Regeln für Beiträge. Die Migration
 * `supabase/migrations/20261117140000_create_posts.sql` prüft dieselben
 * Grenzen in der Datenbank; ein Test hält beide gleich.
 */

export const POST_MIN_LENGTH = 3;
export const POST_MAX_LENGTH = 1000;

export const POST_CATEGORIES = [
  "discussion",
  "fanart",
  "cosplay",
  "news",
  "collection",
] as const satisfies readonly PostCategory[];

/** Kuratierte Anime (`a-one-piece`) oder AniList-Ergebnisse (`anilist-21`). */
export const ANIME_ID_PATTERN = /^(a-[a-z0-9-]{1,60}|anilist-[0-9]{1,10})$/;

/**
 * Länge wie in Postgres (`char_length`): Zeichen statt UTF-16-Einheiten,
 * damit ein Emoji im Browser nicht doppelt zählt.
 */
export function postLength(text: string): number {
  return [...text].length;
}

export type PostBodyResult =
  { ok: true; body: string } | { ok: false; error: string };

/** Trimmt den Text und prüft die Länge. */
export function validatePostBody(raw: string): PostBodyResult {
  const body = raw.trim();
  const length = postLength(body);
  if (length < POST_MIN_LENGTH)
    return {
      ok: false,
      error: `Dein Beitrag braucht mindestens ${POST_MIN_LENGTH} Zeichen.`,
    };
  if (length > POST_MAX_LENGTH)
    return {
      ok: false,
      error: `Dein Beitrag ist ${length - POST_MAX_LENGTH} Zeichen zu lang.`,
    };
  return { ok: true, body };
}

export function isPostCategory(value: unknown): value is PostCategory {
  return (POST_CATEGORIES as readonly unknown[]).includes(value);
}

export function isValidAnimeId(value: string): boolean {
  return ANIME_ID_PATTERN.test(value);
}
