/**
 * Tabelle `public.posts` (siehe supabase/migrations und docs/specs/posts.md).
 *
 * Reine Umwandlungen ohne Supabase-Client, damit sie ohne Browser und
 * Datenbank testbar sind.
 */

import type { Post, PostCategory } from "@/features/community/types";
import {
  PUBLIC_PROFILE_COLUMNS,
  type PublicProfileRow,
} from "@/features/profiles/profile-row";
import { isPostCategory, isValidAnimeId } from "@/lib/validation/posts";

export type PostRow = {
  id: string;
  author_id: string;
  body: string;
  category: string;
  anime_id: string | null;
  contains_spoiler: boolean;
  created_at: string;
  edited_at: string | null;
};

/** Beitrag mit eingebettetem Autorprofil (`author:profiles(…)`). */
export type PostRowWithAuthor = PostRow & { author: PublicProfileRow | null };

export const POST_COLUMNS =
  "id, author_id, body, category, anime_id, contains_spoiler, created_at, edited_at";

/** Ein Aufruf liefert Beitrag und Autor über den Fremdschlüssel `author_id`. */
export const POST_SELECT = `${POST_COLUMNS}, author:profiles(${PUBLIC_PROFILE_COLUMNS})`;

/** Spalten, die ein Nutzer beim Anlegen setzen darf (Spaltenrechte in der Migration). */
export type PostInsert = {
  body: string;
  category: PostCategory;
  anime_id: string | null;
  contains_spoiler: boolean;
};

/** Spalten, die ein Nutzer beim Bearbeiten ändern darf. */
export type PostUpdate = Pick<PostInsert, "body" | "contains_spoiler">;

export type NewPostInput = Pick<
  Post,
  "body" | "animeId" | "category" | "containsSpoiler"
>;

export function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    body: row.body,
    animeId: row.anime_id ?? undefined,
    category: isPostCategory(row.category) ? row.category : "discussion",
    media: [],
    containsSpoiler: row.contains_spoiler,
    createdAt: row.created_at,
    editedAt: row.edited_at ?? undefined,
    baseLikeCount: 0,
    source: "supabase",
  };
}

export function toPostInsert(input: NewPostInput): PostInsert {
  const animeId = input.animeId?.trim();
  return {
    body: input.body.trim(),
    category: input.category,
    anime_id: animeId && isValidAnimeId(animeId) ? animeId : null,
    contains_spoiler: input.containsSpoiler,
  };
}

export function toPostUpdate(
  input: Pick<Post, "body" | "containsSpoiler">,
): PostUpdate {
  return { body: input.body.trim(), contains_spoiler: input.containsSpoiler };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Echte Beiträge haben UUIDs, Demo-Beiträge IDs wie `p-…`. */
export function isUuid(id: string): boolean {
  return UUID_PATTERN.test(id);
}

/** Fehler beim Speichern eines Beitrags, mit verständlicher Meldung. */
export class PostSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostSaveError";
  }
}

export const POST_NOT_ALLOWED_MESSAGE =
  "Diesen Beitrag kannst du nicht ändern. Er gehört einem anderen Konto oder wurde gelöscht.";

type DbError = { code?: string; message?: string } | null | undefined;

/** Übersetzt Datenbankfehler beim Anlegen, Ändern oder Löschen ins Deutsche. */
export function postErrorMessage(error: DbError | Error): string {
  if (error instanceof PostSaveError) return error.message;
  const code = (error as { code?: string } | null | undefined)?.code;
  switch (code) {
    // Fremdschlüssel: Zum Konto gibt es (noch) keine Profilzeile.
    case "23503":
      return "Dein Profil ist noch nicht eingerichtet. Lade die Seite neu und versuche es erneut.";
    case "23514":
      return "Der Beitrag entspricht nicht den Regeln (Länge, Kategorie oder Anime).";
    // Keine Rechte, meist weil die Sitzung abgelaufen ist.
    case "42501":
      return "Dafür fehlt die Berechtigung. Bitte melde dich erneut an.";
  }
  if (error?.message?.toLowerCase().includes("fetch"))
    return "Keine Verbindung. Prüfe dein Internet und versuche es erneut.";
  return "Beitrag konnte nicht gespeichert werden.";
}
