"use client";

import { useSyncExternalStore } from "react";
import { countsByIds, isDuplicateEntry } from "@/features/community/like-row";
import { isMissingSchema } from "@/features/profiles/profile-row";
import { getSupabase } from "@/features/auth/supabase-auth";

/**
 * Echte Likes und Lesezeichen (docs/specs/likes.md).
 *
 * Zahlen kommen für alle über `post_like_counts` und `comment_like_counts`.
 * Eigene Likes und Lesezeichen lädt die App nur für ein angemeldetes
 * Supabase-Konto (RLS: nur eigene lesbar). Ohne Tabellen bleibt alles im
 * Demo-Store.
 */

type Flags = Record<string, true>;

type RemoteLikesState = {
  status: "ok" | "unavailable";
  /** Konto, dessen eigene Likes geladen sind. */
  userId: string | null;
  postCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  myPostLikes: Flags;
  myCommentLikes: Flags;
  mySaves: Flags;
};

const serverState: RemoteLikesState = {
  status: "ok",
  userId: null,
  postCounts: {},
  commentCounts: {},
  myPostLikes: {},
  myCommentLikes: {},
  mySaves: {},
};
let state: RemoteLikesState = serverState;
const listeners = new Set<() => void>();

function setState(update: Partial<RemoteLikesState>) {
  state = { ...state, ...update };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRemoteLikes(): RemoteLikesState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

export function canUseRemoteLikes(): boolean {
  return state.status !== "unavailable" && getSupabase() !== null;
}

function handleReadError(error: { code?: string; message?: string }) {
  if (isMissingSchema(error)) {
    setState({ status: "unavailable" });
    return;
  }
  console.warn("[likes] Likes konnten nicht geladen werden:", error.message);
}

function withFlags(current: Flags, ids: string[], on: string[]): Flags {
  const next = { ...current };
  for (const id of ids) delete next[id];
  for (const id of on) next[id] = true;
  return next;
}

/** Eigene Einträge einer Tabelle für die angegebenen IDs (RLS liefert nur eigene). */
async function loadMine(
  table: "post_likes" | "comment_likes" | "post_saves",
  idKey: "post_id" | "comment_id",
  ids: string[],
): Promise<string[] | null> {
  const supabase = getSupabase();
  if (!supabase || ids.length === 0) return [];
  const { data, error } = await supabase
    .from(table)
    .select(idKey)
    .in(idKey, ids);
  if (error) {
    handleReadError(error);
    return null;
  }
  return ((data ?? []) as Record<string, string>[]).map((row) => row[idKey]);
}

/** Lädt Like-Zahlen und (angemeldet) eigene Likes und Lesezeichen für Beiträge. */
export async function loadPostLikes(postIds: string[]) {
  const supabase = getSupabase();
  if (!supabase || state.status === "unavailable" || postIds.length === 0)
    return;
  const { data, error } = await supabase.rpc("post_like_counts", {
    post_ids: postIds,
  });
  if (error) {
    handleReadError(error);
    return;
  }
  setState({
    postCounts: {
      ...state.postCounts,
      ...countsByIds(postIds, data ?? [], "post_id"),
    },
  });
  if (state.userId) await loadMyPostFlags(postIds, state.userId);
}

/** Lädt Like-Zahlen und (angemeldet) eigene Likes für Kommentare. */
export async function loadCommentLikes(commentIds: string[]) {
  const supabase = getSupabase();
  if (!supabase || state.status === "unavailable" || commentIds.length === 0)
    return;
  const { data, error } = await supabase.rpc("comment_like_counts", {
    comment_ids: commentIds,
  });
  if (error) {
    handleReadError(error);
    return;
  }
  setState({
    commentCounts: {
      ...state.commentCounts,
      ...countsByIds(commentIds, data ?? [], "comment_id"),
    },
  });
  if (state.userId) await loadMyCommentFlags(commentIds, state.userId);
}

async function loadMyPostFlags(postIds: string[], userId: string) {
  const [likes, saves] = await Promise.all([
    loadMine("post_likes", "post_id", postIds),
    loadMine("post_saves", "post_id", postIds),
  ]);
  // Inzwischen ein anderes Konto angemeldet: Ergebnis verwerfen.
  if (state.userId !== userId) return;
  setState({
    ...(likes
      ? { myPostLikes: withFlags(state.myPostLikes, postIds, likes) }
      : {}),
    ...(saves ? { mySaves: withFlags(state.mySaves, postIds, saves) } : {}),
  });
}

async function loadMyCommentFlags(commentIds: string[], userId: string) {
  const likes = await loadMine("comment_likes", "comment_id", commentIds);
  if (state.userId !== userId || !likes) return;
  setState({
    myCommentLikes: withFlags(state.myCommentLikes, commentIds, likes),
  });
}

/**
 * Wechselt das Konto, dessen eigene Likes gelten. Ohne Supabase-Konto
 * (`null`) gibt es keine eigenen Datenbank-Likes; die Zahlen bleiben.
 */
export function syncLikesForUser(userId: string | null) {
  if (state.userId === userId) return;
  setState({ userId, myPostLikes: {}, myCommentLikes: {}, mySaves: {} });
  if (!userId || state.status === "unavailable") return;
  void loadMyPostFlags(Object.keys(state.postCounts), userId);
  void loadMyCommentFlags(Object.keys(state.commentCounts), userId);
}

type Target = {
  table: "post_likes" | "comment_likes" | "post_saves";
  idKey: "post_id" | "comment_id";
  flags: "myPostLikes" | "myCommentLikes" | "mySaves";
  counts?: "postCounts" | "commentCounts";
};

const TARGETS = {
  postLike: {
    table: "post_likes",
    idKey: "post_id",
    flags: "myPostLikes",
    counts: "postCounts",
  },
  commentLike: {
    table: "comment_likes",
    idKey: "comment_id",
    flags: "myCommentLikes",
    counts: "commentCounts",
  },
  postSave: { table: "post_saves", idKey: "post_id", flags: "mySaves" },
} satisfies Record<string, Target>;

/** Setzt den Zustand sofort (optimistisch) und gibt eine Rücknahme zurück. */
function applyOptimistic(target: Target, id: string, on: boolean) {
  const before = {
    flags: state[target.flags],
    counts: target.counts ? state[target.counts] : undefined,
  };
  const flags = { ...state[target.flags] };
  if (on) flags[id] = true;
  else delete flags[id];
  const update: Partial<RemoteLikesState> = { [target.flags]: flags };
  if (target.counts) {
    const counts = state[target.counts];
    update[target.counts] = {
      ...counts,
      [id]: Math.max(0, (counts[id] ?? 0) + (on ? 1 : -1)),
    };
  }
  setState(update);
  return () => {
    const restore: Partial<RemoteLikesState> = { [target.flags]: before.flags };
    if (target.counts && before.counts) restore[target.counts] = before.counts;
    setState(restore);
  };
}

/**
 * Setzt oder entfernt einen eigenen Like bzw. ein Lesezeichen in der
 * Datenbank. Bei einem Fehler wird die Anzeige zurückgesetzt und der
 * Originalfehler weitergegeben.
 */
async function setFlag(target: Target, id: string, on: boolean) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase ist nicht konfiguriert.");
  const alreadyOn = Boolean(state[target.flags][id]);
  if (alreadyOn === on) return;
  const revert = applyOptimistic(target, id, on);

  const table = supabase.from(target.table);
  const { error } = !on
    ? await table.delete().eq(target.idKey, id)
    : target.idKey === "post_id"
      ? await table.insert({ post_id: id })
      : await table.insert({ comment_id: id });
  if (!error || (on && isDuplicateEntry(error))) return;
  revert();
  if (isMissingSchema(error)) setState({ status: "unavailable" });
  throw error;
}

export function setRemotePostLike(postId: string, on: boolean) {
  return setFlag(TARGETS.postLike, postId, on);
}

export function setRemoteCommentLike(commentId: string, on: boolean) {
  return setFlag(TARGETS.commentLike, commentId, on);
}

export function setRemotePostSaved(postId: string, on: boolean) {
  return setFlag(TARGETS.postSave, postId, on);
}
