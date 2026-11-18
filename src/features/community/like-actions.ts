"use client";

import { type LikeKind, likeErrorMessage } from "@/features/community/like-row";
import {
  canUseRemoteLikes,
  setRemoteCommentLike,
  setRemotePostLike,
  setRemotePostSaved,
} from "@/features/community/likes-supabase";
import { isMissingSchema } from "@/features/profiles/profile-row";
import { demoActions, getDemoState } from "@/features/demo/store";

/**
 * Like- und Speichern-Aktionen für die Oberfläche. Supabase-Konten schreiben
 * bei echten Beiträgen und Kommentaren in die Datenbank, sonst bleibt alles
 * im Demo-Store. Fehler kommen als `Error` mit deutscher Meldung zurück; die
 * Anzeige ist dann schon zurückgesetzt.
 */

type Item = { id: string; source?: "demo" | "supabase" };

function goesToDatabase(item: Item): boolean {
  return (
    getDemoState().session?.kind === "supabase" &&
    item.source === "supabase" &&
    canUseRemoteLikes()
  );
}

async function run(
  item: Item,
  kind: LikeKind,
  remote: () => Promise<void>,
  local: () => void,
) {
  if (!goesToDatabase(item)) {
    local();
    return;
  }
  try {
    await remote();
  } catch (error) {
    // Migration noch nicht angewendet: wie bisher lokal speichern.
    if (isMissingSchema(error as { code?: string })) {
      local();
      return;
    }
    throw new Error(likeErrorMessage(error as Error, kind));
  }
}

export function togglePostLike(post: Item & { liked: boolean }) {
  return run(
    post,
    "like",
    () => setRemotePostLike(post.id, !post.liked),
    () => demoActions.togglePostLike(post.id),
  );
}

export function toggleCommentLike(comment: Item & { liked: boolean }) {
  return run(
    comment,
    "like",
    () => setRemoteCommentLike(comment.id, !comment.liked),
    () => demoActions.toggleCommentLike(comment.id),
  );
}

export function togglePostSaved(post: Item & { saved: boolean }) {
  return run(
    post,
    "save",
    () => setRemotePostSaved(post.id, !post.saved),
    () => demoActions.togglePostSaved(post.id),
  );
}
