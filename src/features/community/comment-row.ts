/**
 * Tabelle `public.comments` (siehe supabase/migrations und docs/specs/comments.md).
 *
 * Reine Umwandlungen ohne Supabase-Client, damit sie ohne Browser und
 * Datenbank testbar sind.
 */

import type { Comment } from "@/features/community/types";
import { isUuid } from "@/features/community/post-row";
import {
  PUBLIC_PROFILE_COLUMNS,
  type PublicProfileRow,
} from "@/features/profiles/profile-row";
import { isValidEpisodeNumber } from "@/lib/validation/comments";
import { isValidAnimeId } from "@/lib/validation/posts";

export type CommentRow = {
  id: string;
  author_id: string;
  post_id: string | null;
  anime_id: string | null;
  episode_number: number | null;
  parent_id: string | null;
  body: string;
  contains_spoiler: boolean;
  created_at: string;
};

export type CommentRowWithAuthor = CommentRow & {
  author: PublicProfileRow | null;
};

export const COMMENT_COLUMNS =
  "id, author_id, post_id, anime_id, episode_number, parent_id, body, contains_spoiler, created_at";

export const COMMENT_SELECT = `${COMMENT_COLUMNS}, author:profiles(${PUBLIC_PROFILE_COLUMNS})`;

/** Höchstzahl an Kommentaren, die je Beitrag oder Episode geladen werden. */
export const THREAD_LIMIT = 200;

/** Ziel in der Datenbank: ein echter Beitrag oder eine Episode. */
export type CommentDbTarget =
  | { kind: "post"; postId: string }
  | { kind: "episode"; animeId: string; episodeNumber: number };

/** Schlüssel für Caches und Zähler, z. B. `post:<uuid>` oder `episode:a-frieren:34`. */
export function dbTargetKey(target: CommentDbTarget): string {
  return target.kind === "post"
    ? `post:${target.postId}`
    : `episode:${target.animeId}:${target.episodeNumber}`;
}

/**
 * Bildet das Ziel der Oberfläche auf die Datenbank ab. `undefined` heißt: Das
 * Ziel liegt nicht in der Datenbank (Demo-Beitrag oder unbekannte Episode),
 * der Kommentar bleibt im Demo-Store.
 */
export function toDbTarget(
  target: Comment["target"],
  resolveEpisode: (
    episodeId: string,
  ) => { animeId: string; number: number } | undefined,
): CommentDbTarget | undefined {
  if (target.type === "post")
    return isUuid(target.postId)
      ? { kind: "post", postId: target.postId }
      : undefined;
  const episode = resolveEpisode(target.episodeId);
  if (
    !episode ||
    !isValidAnimeId(episode.animeId) ||
    !isValidEpisodeNumber(episode.number)
  )
    return undefined;
  return {
    kind: "episode",
    animeId: episode.animeId,
    episodeNumber: episode.number,
  };
}

/** Wandelt eine Zeile um; das Ziel der Oberfläche kommt aus dem Ladekontext. */
export function rowToComment(
  row: CommentRow,
  target: Comment["target"],
): Comment {
  return {
    id: row.id,
    authorId: row.author_id,
    target,
    parentId: row.parent_id ?? undefined,
    body: row.body,
    containsSpoiler: row.contains_spoiler,
    createdAt: row.created_at,
    baseLikeCount: 0,
    source: "supabase",
  };
}

/** Spalten, die ein Nutzer beim Anlegen setzen darf (Spaltenrechte in der Migration). */
export type CommentInsert = {
  post_id: string | null;
  anime_id: string | null;
  episode_number: number | null;
  parent_id: string | null;
  body: string;
  contains_spoiler: boolean;
};

export function toCommentInsert(
  target: CommentDbTarget,
  input: { body: string; parentId?: string; containsSpoiler: boolean },
): CommentInsert {
  return {
    post_id: target.kind === "post" ? target.postId : null,
    anime_id: target.kind === "episode" ? target.animeId : null,
    episode_number: target.kind === "episode" ? target.episodeNumber : null,
    parent_id: input.parentId ?? null,
    body: input.body.trim(),
    contains_spoiler: input.containsSpoiler,
  };
}

/** Fehler beim Speichern eines Kommentars, mit verständlicher Meldung. */
export class CommentSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommentSaveError";
  }
}

export const COMMENT_NOT_ALLOWED_MESSAGE =
  "Diesen Kommentar kannst du nicht löschen. Er gehört einem anderen Konto oder wurde schon gelöscht.";

type DbError = { code?: string; message?: string } | null | undefined;

/** Übersetzt Datenbankfehler beim Kommentieren oder Löschen ins Deutsche. */
export function commentErrorMessage(error: DbError | Error): string {
  if (error instanceof CommentSaveError) return error.message;
  const code = (error as { code?: string } | null | undefined)?.code;
  switch (code) {
    // Fremdschlüssel: Beitrag, Elternkommentar oder Profil fehlt.
    case "23503":
      return "Der Beitrag oder Kommentar, auf den du antwortest, existiert nicht mehr. Lade die Seite neu.";
    case "23514":
      return "Der Kommentar entspricht nicht den Regeln (Länge oder Antwortebene).";
    case "42501":
      return "Dafür fehlt die Berechtigung. Bitte melde dich erneut an.";
  }
  if (error?.message?.toLowerCase().includes("fetch"))
    return "Keine Verbindung. Prüfe dein Internet und versuche es erneut.";
  return "Kommentar konnte nicht gespeichert werden.";
}
