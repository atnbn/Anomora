"use client";

import type { Post } from "@/features/community/types";
import {
  type NewPostInput,
  PostSaveError,
  postErrorMessage,
} from "@/features/community/post-row";
import {
  canUseRemotePosts,
  createRemotePost,
  deleteRemotePost,
  updateRemotePost,
} from "@/features/community/posts-supabase";
import { isMissingSchema } from "@/features/profiles/profile-row";
import { demoActions, getDemoState } from "@/features/demo/store";

/**
 * Beitragsaktionen für die Oberfläche. Supabase-Konten schreiben in die
 * Tabelle `posts`, Demo-Konten in den lokalen Store. Fehler kommen als
 * `PostSaveError` mit deutscher Meldung zurück.
 */

function toSaveError(error: unknown): PostSaveError {
  return new PostSaveError(
    postErrorMessage(error as { code?: string; message?: string }),
  );
}

/** true, wenn neue Beiträge dieses Kontos in der Datenbank landen. */
export function postsGoToDatabase(): boolean {
  return getDemoState().session?.kind === "supabase" && canUseRemotePosts();
}

export async function publishPost(
  input: NewPostInput & Pick<Post, "media">,
): Promise<Post | undefined> {
  if (!postsGoToDatabase()) return demoActions.createPost(input);
  try {
    return await createRemotePost(input);
  } catch (error) {
    // Migration noch nicht angewendet: wie bisher lokal speichern.
    if (isMissingSchema(error as { code?: string }))
      return demoActions.createPost(input);
    throw toSaveError(error);
  }
}

export async function savePostEdit(
  post: Post,
  input: Pick<Post, "body" | "containsSpoiler">,
): Promise<void> {
  if (post.source !== "supabase") {
    demoActions.updatePost(post.id, input);
    return;
  }
  try {
    await updateRemotePost(post.id, input);
  } catch (error) {
    throw toSaveError(error);
  }
}

export async function removeOwnPost(post: Post): Promise<void> {
  if (post.source !== "supabase") {
    demoActions.deletePost(post.id);
    return;
  }
  try {
    await deleteRemotePost(post.id);
  } catch (error) {
    throw toSaveError(error);
  }
}
