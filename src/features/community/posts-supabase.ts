"use client";

import { useSyncExternalStore } from "react";
import type { Post } from "@/features/community/types";
import {
  type NewPostInput,
  POST_NOT_ALLOWED_MESSAGE,
  POST_SELECT,
  type PostRowWithAuthor,
  PostSaveError,
  rowToPost,
  toPostInsert,
  toPostUpdate,
} from "@/features/community/post-row";
import {
  type PublicProfileRow,
  isMissingSchema,
  rowToUserProfile,
} from "@/features/profiles/profile-row";
import { getSupabase } from "@/features/auth/supabase-auth";
import { loadPostCommentCounts } from "@/features/community/comments-supabase";
import { loadPostLikes } from "@/features/community/likes-supabase";
import { registerRemoteProfiles } from "@/lib/data/users";

/**
 * Echte Beiträge aus der Tabelle `posts` (docs/specs/posts.md).
 *
 * Ein kleiner Client-Store hält die zuletzt geladenen Beiträge; `usePosts()`
 * mischt sie mit den Demo-Beiträgen. Lesen ist öffentlich, Schreiben schützt
 * die Datenbank per RLS. Ohne Supabase oder ohne angewendete Migration bleibt
 * die Liste leer (`unavailable`) und die App nutzt wie bisher den Demo-Store.
 */

export const FEED_LIMIT = 50;

type RemoteStatus = "idle" | "loading" | "ready" | "unavailable";

type RemotePostsState = {
  status: RemoteStatus;
  posts: Post[];
};

const serverState: RemotePostsState = { status: "idle", posts: [] };
let state: RemotePostsState = serverState;
const listeners = new Set<() => void>();

function setState(update: Partial<RemotePostsState>) {
  state = { ...state, ...update };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRemotePosts(): RemotePostsState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

/** Echte Beiträge können geschrieben werden, solange die Tabelle nicht fehlt. */
export function canUseRemotePosts(): boolean {
  return state.status !== "unavailable" && getSupabase() !== null;
}

/** Fügt Beiträge ein oder ersetzt sie (gleiche ID), neueste zuerst. */
function upsertPosts(posts: Post[]) {
  const byId = new Map(state.posts.map((post) => [post.id, post]));
  for (const post of posts) byId.set(post.id, post);
  setState({
    posts: [...byId.values()].toSorted(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    ),
  });
}

/** Wandelt Zeilen mit Autor um und registriert die Autorprofile. */
function acceptRows(rows: PostRowWithAuthor[]): Post[] {
  registerRemoteProfiles(
    rows
      .map((row) => row.author)
      .filter((author): author is PublicProfileRow => author !== null)
      .map(rowToUserProfile),
  );
  return rows.map(rowToPost);
}

function markUnavailable(error: { code?: string; message?: string }) {
  if (!isMissingSchema(error))
    console.warn(
      "[posts] Beiträge konnten nicht geladen werden:",
      error.message,
    );
  setState({ status: "unavailable" });
}

/** Lädt die neuesten Beiträge; wird einmal im DemoProvider gestartet. */
export async function loadRemotePosts() {
  const supabase = getSupabase();
  if (!supabase) {
    setState({ status: "unavailable" });
    return;
  }
  if (state.status === "loading") return;
  setState({ status: "loading" });
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);
  if (error) {
    markUnavailable(error);
    return;
  }
  const posts = acceptRows((data ?? []) as unknown as PostRowWithAuthor[]);
  upsertPosts(posts);
  setState({ status: "ready" });
  void loadPostCommentCounts(posts.map((post) => post.id));
  void loadPostLikes(posts.map((post) => post.id));
}

/** Lädt einen einzelnen Beitrag nach, z. B. für geteilte Links auf ältere Beiträge. */
export async function fetchRemotePost(id: string): Promise<Post | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    if (!isMissingSchema(error))
      console.warn(
        "[posts] Beitrag konnte nicht geladen werden:",
        error.message,
      );
    return null;
  }
  if (!data) return null;
  const [post] = acceptRows([data as unknown as PostRowWithAuthor]);
  upsertPosts([post]);
  void loadPostCommentCounts([post.id]);
  void loadPostLikes([post.id]);
  return post;
}

function requireClient() {
  const supabase = getSupabase();
  if (!supabase) throw new PostSaveError("Supabase ist nicht konfiguriert.");
  return supabase;
}

/**
 * Legt einen Beitrag im Namen des angemeldeten Kontos an. `author_id` setzt
 * die Datenbank selbst. Wirft bei fehlender Tabelle den Originalfehler, damit
 * der Aufrufer auf den Demo-Store ausweichen kann.
 */
export async function createRemotePost(input: NewPostInput): Promise<Post> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("posts")
    .insert(toPostInsert(input))
    .select(POST_SELECT)
    .single();
  if (error) {
    if (isMissingSchema(error)) setState({ status: "unavailable" });
    throw error;
  }
  const [post] = acceptRows([data as unknown as PostRowWithAuthor]);
  upsertPosts([post]);
  return post;
}

/** Ändert Text und Spoiler-Hinweis eines eigenen Beitrags. */
export async function updateRemotePost(
  id: string,
  input: Pick<Post, "body" | "containsSpoiler">,
): Promise<Post> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("posts")
    .update(toPostUpdate(input))
    .eq("id", id)
    .select(POST_SELECT)
    .maybeSingle();
  if (error) throw error;
  // Keine Zeile: fremder oder gelöschter Beitrag, RLS hat das Ändern verhindert.
  if (!data) throw new PostSaveError(POST_NOT_ALLOWED_MESSAGE);
  const [post] = acceptRows([data as unknown as PostRowWithAuthor]);
  upsertPosts([post]);
  return post;
}

/** Löscht einen eigenen Beitrag endgültig. */
export async function deleteRemotePost(id: string): Promise<void> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0)
    throw new PostSaveError(POST_NOT_ALLOWED_MESSAGE);
  setState({ posts: state.posts.filter((post) => post.id !== id) });
}
