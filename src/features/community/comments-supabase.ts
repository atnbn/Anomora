"use client";

import { useSyncExternalStore } from "react";
import type { Comment } from "@/features/community/types";
import {
  COMMENT_NOT_ALLOWED_MESSAGE,
  COMMENT_SELECT,
  type CommentDbTarget,
  type CommentRowWithAuthor,
  CommentSaveError,
  THREAD_LIMIT,
  dbTargetKey,
  rowToComment,
  toCommentInsert,
  toDbTarget,
} from "@/features/community/comment-row";
import {
  type PublicProfileRow,
  isMissingSchema,
  rowToUserProfile,
} from "@/features/profiles/profile-row";
import { getSupabase } from "@/features/auth/supabase-auth";
import { getEpisodeByIdSync } from "@/lib/data/anime";
import { registerRemoteProfiles } from "@/lib/data/users";
import { loadCommentLikes } from "@/features/community/likes-supabase";

/**
 * Echte Kommentare aus der Tabelle `comments` (docs/specs/comments.md).
 *
 * Kommentare werden je Ziel (echter Beitrag oder Episode) geladen, sobald ein
 * Thread angezeigt wird. Kommentarzahlen kommen über die Datenbankfunktionen
 * `post_comment_counts` und `episode_comment_counts`. Ohne Supabase oder ohne
 * angewendete Migration bleibt alles wie bisher im Demo-Store.
 */

type RemoteCommentsState = {
  /** `unavailable`: Tabelle fehlt oder Supabase ist nicht konfiguriert. */
  status: "ok" | "unavailable";
  /** Geladene Kommentare je Ziel (`dbTargetKey`). */
  threads: Record<string, Comment[]>;
  /** Ziele, deren Kommentare gerade laden oder geladen sind. */
  requested: Record<string, true>;
  /** Kommentarzahl je echtem Beitrag. */
  postCounts: Record<string, number>;
  /** Kommentarzahl je Anime und Folge. */
  episodeCounts: Record<string, Record<number, number>>;
  /** Anime, deren Folgenzahlen geladen werden oder sind. */
  requestedAnime: Record<string, true>;
};

const serverState: RemoteCommentsState = {
  status: "ok",
  threads: {},
  requested: {},
  postCounts: {},
  episodeCounts: {},
  requestedAnime: {},
};
let state: RemoteCommentsState = serverState;
const listeners = new Set<() => void>();

function setState(update: Partial<RemoteCommentsState>) {
  state = { ...state, ...update };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRemoteComments(): RemoteCommentsState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

/** Ordnet eine Episoden-ID der App Anime und Folgennummer zu. */
export function resolveEpisode(episodeId: string) {
  const episode = getEpisodeByIdSync(episodeId);
  return episode
    ? { animeId: episode.animeId, number: episode.number }
    : undefined;
}

/** Ziel in der Datenbank oder `undefined`, wenn es nur im Demo-Store liegt. */
export function dbTargetFor(
  target: Comment["target"],
): CommentDbTarget | undefined {
  return toDbTarget(target, resolveEpisode);
}

export function canUseRemoteComments(): boolean {
  return state.status !== "unavailable" && getSupabase() !== null;
}

function handleReadError(error: { code?: string; message?: string }) {
  if (isMissingSchema(error)) {
    setState({ status: "unavailable" });
    return;
  }
  console.warn(
    "[comments] Kommentare konnten nicht geladen werden:",
    error.message,
  );
}

function registerAuthors(rows: CommentRowWithAuthor[]) {
  registerRemoteProfiles(
    rows
      .map((row) => row.author)
      .filter((author): author is PublicProfileRow => author !== null)
      .map(rowToUserProfile),
  );
}

function adjustCount(target: CommentDbTarget, delta: number) {
  if (target.kind === "post") {
    const current = state.postCounts[target.postId] ?? 0;
    setState({
      postCounts: {
        ...state.postCounts,
        [target.postId]: Math.max(0, current + delta),
      },
    });
    return;
  }
  const perAnime = state.episodeCounts[target.animeId] ?? {};
  const current = perAnime[target.episodeNumber] ?? 0;
  setState({
    episodeCounts: {
      ...state.episodeCounts,
      [target.animeId]: {
        ...perAnime,
        [target.episodeNumber]: Math.max(0, current + delta),
      },
    },
  });
}

/** Lädt die Kommentare eines Ziels einmal (älteste zuerst, höchstens 200). */
export async function loadThread(
  target: CommentDbTarget,
  uiTarget: Comment["target"],
) {
  const key = dbTargetKey(target);
  const supabase = getSupabase();
  if (!supabase || state.status === "unavailable" || state.requested[key])
    return;
  setState({ requested: { ...state.requested, [key]: true } });

  let query = supabase.from("comments").select(COMMENT_SELECT);
  query =
    target.kind === "post"
      ? query.eq("post_id", target.postId)
      : query
          .eq("anime_id", target.animeId)
          .eq("episode_number", target.episodeNumber);
  const { data, error } = await query
    .order("created_at", { ascending: true })
    .limit(THREAD_LIMIT);

  if (error) {
    const { [key]: _removed, ...rest } = state.requested;
    void _removed;
    setState({ requested: rest });
    handleReadError(error);
    return;
  }
  const rows = (data ?? []) as unknown as CommentRowWithAuthor[];
  registerAuthors(rows);
  setState({
    threads: {
      ...state.threads,
      [key]: rows.map((row) => rowToComment(row, uiTarget)),
    },
  });
  void loadCommentLikes(rows.map((row) => row.id));
}

/** Lädt die Kommentarzahlen für echte Beiträge. */
export async function loadPostCommentCounts(postIds: string[]) {
  const supabase = getSupabase();
  if (!supabase || state.status === "unavailable" || postIds.length === 0)
    return;
  const { data, error } = await supabase.rpc("post_comment_counts", {
    post_ids: postIds,
  });
  if (error) {
    handleReadError(error);
    return;
  }
  const counts = { ...state.postCounts };
  // Beiträge ohne Kommentare liefert die Funktion nicht – sie zählen 0.
  for (const id of postIds) counts[id] = 0;
  for (const entry of (data ?? []) as {
    post_id: string;
    comment_count: number;
  }[])
    counts[entry.post_id] = Number(entry.comment_count);
  setState({ postCounts: counts });
}

/** Lädt die Kommentarzahlen je Folge für die angegebenen Anime (je Anime einmal). */
export async function loadEpisodeCommentCounts(animeIds: string[]) {
  const supabase = getSupabase();
  const missing = animeIds.filter((id) => !state.requestedAnime[id]);
  if (!supabase || state.status === "unavailable" || missing.length === 0)
    return;
  const requestedAnime = { ...state.requestedAnime };
  for (const id of missing) requestedAnime[id] = true;
  setState({ requestedAnime });

  const { data, error } = await supabase.rpc("episode_comment_counts", {
    anime_ids: missing,
  });
  if (error) {
    handleReadError(error);
    return;
  }
  const episodeCounts = { ...state.episodeCounts };
  for (const id of missing) episodeCounts[id] = {};
  for (const entry of (data ?? []) as {
    anime_id: string;
    episode_number: number;
    comment_count: number;
  }[])
    episodeCounts[entry.anime_id] = {
      ...episodeCounts[entry.anime_id],
      [entry.episode_number]: Number(entry.comment_count),
    };
  setState({ episodeCounts });
}

/**
 * Legt einen Kommentar im Namen des angemeldeten Kontos an. Wirft bei
 * fehlender Tabelle den Originalfehler, damit der Aufrufer auf den
 * Demo-Store ausweichen kann.
 */
export async function createRemoteComment(
  target: CommentDbTarget,
  uiTarget: Comment["target"],
  input: { body: string; parentId?: string; containsSpoiler: boolean },
): Promise<Comment> {
  const supabase = getSupabase();
  if (!supabase) throw new CommentSaveError("Supabase ist nicht konfiguriert.");
  const { data, error } = await supabase
    .from("comments")
    .insert(toCommentInsert(target, input))
    .select(COMMENT_SELECT)
    .single();
  if (error) {
    if (isMissingSchema(error)) setState({ status: "unavailable" });
    throw error;
  }
  const row = data as unknown as CommentRowWithAuthor;
  registerAuthors([row]);
  const comment = rowToComment(row, uiTarget);
  const key = dbTargetKey(target);
  setState({
    threads: {
      ...state.threads,
      [key]: [...(state.threads[key] ?? []), comment],
    },
  });
  adjustCount(target, 1);
  return comment;
}

/** Löscht einen eigenen Kommentar endgültig; Antworten löscht die Datenbank mit. */
export async function deleteRemoteComment(
  comment: Comment,
  target: CommentDbTarget,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new CommentSaveError("Supabase ist nicht konfiguriert.");
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", comment.id)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0)
    throw new CommentSaveError(COMMENT_NOT_ALLOWED_MESSAGE);

  const key = dbTargetKey(target);
  const thread = state.threads[key] ?? [];
  const removed = thread.filter(
    (entry) => entry.id === comment.id || entry.parentId === comment.id,
  );
  setState({
    threads: {
      ...state.threads,
      [key]: thread.filter((entry) => !removed.includes(entry)),
    },
  });
  adjustCount(target, -Math.max(1, removed.length));
}
