"use client";

import type { Comment } from "@/features/community/types";
import {
  CommentSaveError,
  commentErrorMessage,
} from "@/features/community/comment-row";
import {
  canUseRemoteComments,
  createRemoteComment,
  dbTargetFor,
  deleteRemoteComment,
} from "@/features/community/comments-supabase";
import { isUuid } from "@/features/community/post-row";
import { isMissingSchema } from "@/features/profiles/profile-row";
import { demoActions, getDemoState } from "@/features/demo/store";

/**
 * Kommentaraktionen für die Oberfläche. Supabase-Konten schreiben in die
 * Tabelle `comments`, wenn das Ziel in der Datenbank liegt (echter Beitrag
 * oder Episode). Demo-Konten, Kommentare unter Demo-Beiträgen und Antworten
 * auf Demo-Kommentare bleiben im Demo-Store.
 */

type CommentInput = Pick<
  Comment,
  "body" | "target" | "parentId" | "containsSpoiler"
>;

function toSaveError(error: unknown): CommentSaveError {
  return new CommentSaveError(
    commentErrorMessage(error as { code?: string; message?: string }),
  );
}

/** true, wenn ein Kommentar dieses Kontos zu diesem Ziel in der Datenbank landet. */
export function commentGoesToDatabase(
  target: Comment["target"],
  parentId?: string,
): boolean {
  return (
    getDemoState().session?.kind === "supabase" &&
    canUseRemoteComments() &&
    dbTargetFor(target) !== undefined &&
    (!parentId || isUuid(parentId))
  );
}

export async function publishComment(
  input: CommentInput,
): Promise<Comment | undefined> {
  const target = dbTargetFor(input.target);
  if (!target || !commentGoesToDatabase(input.target, input.parentId))
    return demoActions.createComment(input);
  try {
    return await createRemoteComment(target, input.target, input);
  } catch (error) {
    // Migration noch nicht angewendet: wie bisher lokal speichern.
    if (isMissingSchema(error as { code?: string }))
      return demoActions.createComment(input);
    throw toSaveError(error);
  }
}

export async function removeOwnComment(comment: Comment): Promise<void> {
  const target = dbTargetFor(comment.target);
  if (comment.source !== "supabase" || !target) {
    demoActions.deleteComment(comment.id);
    return;
  }
  try {
    await deleteRemoteComment(comment, target);
  } catch (error) {
    throw toSaveError(error);
  }
}
