"use client";

import { useEffect, useMemo } from "react";
import type { Comment, FeedFilter, Post } from "@/features/community/types";
import { demoComments, demoPosts } from "@/data/demo/posts";
import { useDemoState } from "@/features/demo/store";
import { resolveTime, useClock } from "@/features/demo/clock";
import { useRemotePosts } from "@/features/community/posts-supabase";
import {
  dbTargetFor,
  loadEpisodeCommentCounts,
  loadThread,
  useRemoteComments,
} from "@/features/community/comments-supabase";
import { dbTargetKey } from "@/features/community/comment-row";
import { getAnimeByIdSync } from "@/lib/data/anime";
import { useRemoteLikes } from "@/features/community/likes-supabase";
import { resolveLikeState } from "@/features/community/like-row";

export type ResolvedPost = Post & {
  time: number;
  likeCount: number;
  liked: boolean;
  saved: boolean;
  commentCount: number;
  isOwn: boolean;
};

export type ResolvedComment = Comment & {
  time: number;
  likeCount: number;
  liked: boolean;
  isOwn: boolean;
};

/**
 * Alle sichtbaren Beiträge: echte aus der Tabelle `posts`, Demo-Daten und
 * lokal erstellte, ohne gelöschte, entfernte und blockierte Autoren.
 */
export function usePosts(): ResolvedPost[] {
  const demo = useDemoState();
  const clock = useClock();
  const comments = useAllComments();
  const remote = useRemotePosts();
  const { postCounts } = useRemoteComments();
  const likes = useRemoteLikes();

  return useMemo(() => {
    // Echte Kommentare zählt die Datenbank (postCounts), lokal nur Demo-Kommentare.
    const commentCounts = new Map<string, number>();
    for (const comment of comments) {
      if (comment.source !== "supabase" && comment.target.type === "post") {
        commentCounts.set(
          comment.target.postId,
          (commentCounts.get(comment.target.postId) ?? 0) + 1,
        );
      }
    }

    return [...remote.posts, ...demo.createdPosts, ...demoPosts]
      .filter(
        (post) =>
          !demo.deletedPostIds.includes(post.id) &&
          !demo.removedPostIds.includes(post.id) &&
          !demo.blockedUserIds.includes(post.authorId),
      )
      .map((post) => {
        const edit = demo.postEdits[post.id];
        const { likeCount, liked } = resolveLikeState({
          baseLikeCount: post.baseLikeCount,
          remoteCount: likes.postCounts[post.id],
          localLiked: demo.likedPostIds.includes(post.id),
          remoteLiked: Boolean(likes.myPostLikes[post.id]),
        });
        return {
          ...post,
          ...edit,
          time: resolveTime(post.createdAt, post.seeded, clock),
          likeCount,
          liked,
          saved:
            demo.savedPostIds.includes(post.id) ||
            Boolean(likes.mySaves[post.id]),
          commentCount:
            (commentCounts.get(post.id) ?? 0) + (postCounts[post.id] ?? 0),
          isOwn: demo.session?.userId === post.authorId,
        };
      })
      .toSorted((a, b) => b.time - a.time);
  }, [demo, clock, comments, remote, postCounts, likes]);
}

export function filterPosts(
  posts: ResolvedPost[],
  filter: FeedFilter,
  following: string[],
): ResolvedPost[] {
  switch (filter) {
    case "following":
      return posts.filter(
        (post) => following.includes(post.authorId) || post.isOwn,
      );
    case "popular":
      return posts.toSorted(
        (a, b) =>
          b.likeCount + b.commentCount * 5 - (a.likeCount + a.commentCount * 5),
      );
    case "discussion":
    case "fanart":
    case "cosplay":
      return posts.filter((post) => post.category === filter);
    default:
      return posts;
  }
}

/**
 * Alle sichtbaren Kommentare: Demo-Daten, lokal erstellte und die bereits
 * geladenen echten Kommentare, ohne gelöschte, entfernte und blockierte Autoren.
 */
export function useAllComments(): ResolvedComment[] {
  const demo = useDemoState();
  const clock = useClock();
  const { threads } = useRemoteComments();
  const likes = useRemoteLikes();

  return useMemo(
    () =>
      [
        ...demoComments,
        ...demo.createdComments,
        ...Object.values(threads).flat(),
      ]
        .filter(
          (comment) =>
            !demo.deletedCommentIds.includes(comment.id) &&
            !demo.removedCommentIds.includes(comment.id) &&
            !demo.blockedUserIds.includes(comment.authorId),
        )
        .map((comment) => {
          const { likeCount, liked } = resolveLikeState({
            baseLikeCount: comment.baseLikeCount,
            remoteCount: likes.commentCounts[comment.id],
            localLiked: demo.likedCommentIds.includes(comment.id),
            remoteLiked: Boolean(likes.myCommentLikes[comment.id]),
          });
          return {
            ...comment,
            time: resolveTime(comment.createdAt, comment.seeded, clock),
            likeCount,
            liked,
            isOwn: demo.session?.userId === comment.authorId,
          };
        }),
    [demo, clock, threads, likes],
  );
}

export type CommentSort = "newest" | "oldest" | "top";

/** Lädt die echten Kommentare eines Ziels, sobald ein Thread angezeigt wird. */
function useLoadThread(target: Comment["target"]) {
  const { status } = useRemoteComments();
  const dbTarget = status === "ok" ? dbTargetFor(target) : undefined;
  const key = dbTarget ? dbTargetKey(dbTarget) : null;

  useEffect(() => {
    if (!dbTarget) return;
    void loadThread(dbTarget, target);
    // key fasst dbTarget zusammen; target ändert sich mit key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function useComments(
  target: Comment["target"],
  sort: CommentSort = "oldest",
) {
  useLoadThread(target);
  const all = useAllComments();
  const key = target.type === "post" ? target.postId : target.episodeId;

  return useMemo(() => {
    const matching = all.filter((comment) =>
      comment.target.type === "post"
        ? comment.target.postId === key
        : comment.target.episodeId === key,
    );
    const roots = matching.filter((comment) => !comment.parentId);
    const sorted = roots.toSorted((a, b) => {
      if (sort === "top") return b.likeCount - a.likeCount;
      if (sort === "newest") return b.time - a.time;
      return a.time - b.time;
    });
    return {
      total: matching.length,
      threads: sorted.map((root) => ({
        root,
        replies: matching
          .filter((comment) => comment.parentId === root.id)
          .toSorted((a, b) => a.time - b.time),
      })),
    };
  }, [all, key, sort]);
}

/**
 * Kommentarzahl je Episoden-ID: lokale Demo-Kommentare plus die Zahlen aus
 * der Datenbank für die angegebenen Anime (werden bei Bedarf geladen).
 */
export function useEpisodeCommentCounts(
  animeIds: string[],
): Map<string, number> {
  const all = useAllComments();
  const { episodeCounts, status } = useRemoteComments();
  const idsKey = animeIds.join("|");

  useEffect(() => {
    if (status !== "ok" || animeIds.length === 0) return;
    void loadEpisodeCommentCounts(animeIds);
    // idsKey fasst animeIds zusammen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, status]);

  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const comment of all) {
      if (comment.source !== "supabase" && comment.target.type === "episode") {
        counts.set(
          comment.target.episodeId,
          (counts.get(comment.target.episodeId) ?? 0) + 1,
        );
      }
    }
    for (const [animeId, perEpisode] of Object.entries(episodeCounts)) {
      const anime = getAnimeByIdSync(animeId);
      if (!anime) continue;
      for (const [number, count] of Object.entries(perEpisode)) {
        const episodeId = `${anime.slug}-${number}`;
        counts.set(episodeId, (counts.get(episodeId) ?? 0) + count);
      }
    }
    return counts;
  }, [all, episodeCounts]);
}
