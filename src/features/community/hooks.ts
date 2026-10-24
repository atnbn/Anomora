"use client";

import { useMemo } from "react";
import type { Comment, FeedFilter, Post } from "@/features/community/types";
import { demoComments, demoPosts } from "@/data/demo/posts";
import { useDemoState } from "@/features/demo/store";
import { resolveTime, useClock } from "@/features/demo/clock";

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

/** Alle sichtbaren Beiträge: Demo-Daten + eigene, ohne gelöschte und blockierte Autoren. */
export function usePosts(): ResolvedPost[] {
  const demo = useDemoState();
  const clock = useClock();
  const comments = useAllComments();

  return useMemo(() => {
    const commentCounts = new Map<string, number>();
    for (const comment of comments) {
      if (comment.target.type === "post") {
        commentCounts.set(
          comment.target.postId,
          (commentCounts.get(comment.target.postId) ?? 0) + 1,
        );
      }
    }

    return [...demo.createdPosts, ...demoPosts]
      .filter(
        (post) =>
          !demo.deletedPostIds.includes(post.id) &&
          !demo.removedPostIds.includes(post.id) &&
          !demo.blockedUserIds.includes(post.authorId),
      )
      .map((post) => {
        const edit = demo.postEdits[post.id];
        const liked = demo.likedPostIds.includes(post.id);
        return {
          ...post,
          ...edit,
          time: resolveTime(post.createdAt, post.seeded, clock),
          likeCount: post.baseLikeCount + (liked ? 1 : 0),
          liked,
          saved: demo.savedPostIds.includes(post.id),
          commentCount: commentCounts.get(post.id) ?? 0,
          isOwn: demo.session?.userId === post.authorId,
        };
      })
      .toSorted((a, b) => b.time - a.time);
  }, [demo, clock, comments]);
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

function useAllComments(): ResolvedComment[] {
  const demo = useDemoState();
  const clock = useClock();

  return useMemo(
    () =>
      [...demoComments, ...demo.createdComments]
        .filter(
          (comment) =>
            !demo.deletedCommentIds.includes(comment.id) &&
            !demo.removedCommentIds.includes(comment.id) &&
            !demo.blockedUserIds.includes(comment.authorId),
        )
        .map((comment) => {
          const liked = demo.likedCommentIds.includes(comment.id);
          return {
            ...comment,
            time: resolveTime(comment.createdAt, comment.seeded, clock),
            likeCount: comment.baseLikeCount + (liked ? 1 : 0),
            liked,
            isOwn: demo.session?.userId === comment.authorId,
          };
        }),
    [demo, clock],
  );
}

export type CommentSort = "newest" | "oldest" | "top";

export function useComments(
  target: Comment["target"],
  sort: CommentSort = "oldest",
) {
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

export function useEpisodeCommentCounts(): Map<string, number> {
  const all = useAllComments();
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const comment of all) {
      if (comment.target.type === "episode") {
        counts.set(
          comment.target.episodeId,
          (counts.get(comment.target.episodeId) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [all]);
}
