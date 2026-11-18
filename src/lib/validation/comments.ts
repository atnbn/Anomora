import { postLength } from "@/lib/validation/posts";

/**
 * Regeln für Kommentare. Die Migration
 * `supabase/migrations/20261118120000_create_comments.sql` prüft dieselben
 * Grenzen in der Datenbank; ein Test hält beide gleich.
 */

export const COMMENT_MIN_LENGTH = 2;
export const COMMENT_MAX_LENGTH = 600;
export const EPISODE_NUMBER_MAX = 10000;

export type CommentBodyResult =
  { ok: true; body: string } | { ok: false; error: string };

/** Trimmt den Text und prüft die Länge (Zeichen wie in Postgres gezählt). */
export function validateCommentBody(raw: string): CommentBodyResult {
  const body = raw.trim();
  const length = postLength(body);
  if (length < COMMENT_MIN_LENGTH)
    return {
      ok: false,
      error: `Schreib mindestens ${COMMENT_MIN_LENGTH} Zeichen.`,
    };
  if (length > COMMENT_MAX_LENGTH)
    return {
      ok: false,
      error: `Maximal ${COMMENT_MAX_LENGTH} Zeichen – du bist ${length - COMMENT_MAX_LENGTH} drüber.`,
    };
  return { ok: true, body };
}

export function isValidEpisodeNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= EPISODE_NUMBER_MAX;
}
