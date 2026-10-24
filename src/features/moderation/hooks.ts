"use client";

import { useMemo } from "react";
import type { Comment, Post } from "@/features/community/types";
import type {
  DemoReport,
  ModerationLogEntry,
  UserBan,
} from "@/features/moderation/types";
import { findActiveBan, useDemoState } from "@/features/demo/store";
import { resolveTime, useClock } from "@/features/demo/clock";
import { demoComments, demoPosts } from "@/data/demo/posts";
import { getAnimeByIdSync, getEpisodeByIdSync } from "@/lib/data/anime";
import { getUserByIdSync } from "@/lib/data/users";
import { episodeHref } from "@/features/anime/labels";

export type ReportTarget = {
  /** Kurzbeschreibung für Listen. */
  excerpt: string;
  authorId?: string;
  /** Link zum Inhalt in der App, falls noch sichtbar. */
  href?: string;
  /** Kontext, z. B. „Kommentar zu Episode 1185 von Detektiv Conan“. */
  context?: string;
  contextHref?: string;
  removed: boolean;
  deleted: boolean;
  post?: Post;
  comment?: Comment;
};

export type ResolvedReport = DemoReport & {
  time: number;
  handledTime?: number;
  target: ReportTarget;
  /** Wie oft dasselbe Ziel insgesamt gemeldet wurde. */
  targetReportCount: number;
};

/** Inhalt hinter einer Meldung, auch wenn er entfernt oder gelöscht wurde. */
export function useTargetResolver() {
  const demo = useDemoState();
  return useMemo(() => {
    const posts = [...demo.createdPosts, ...demoPosts];
    const comments = [...demo.createdComments, ...demoComments];

    return (type: DemoReport["targetType"], id: string): ReportTarget => {
      if (type === "post") {
        const raw = posts.find((post) => post.id === id);
        const post = raw ? { ...raw, ...demo.postEdits[id] } : undefined;
        const removed = demo.removedPostIds.includes(id);
        const deleted = !post || demo.deletedPostIds.includes(id);
        const anime = post?.animeId
          ? getAnimeByIdSync(post.animeId)
          : undefined;
        return {
          excerpt: post?.body ?? "Beitrag wurde von der Person gelöscht.",
          authorId: post?.authorId,
          href: !removed && !deleted ? `/community/posts/${id}` : undefined,
          context: anime
            ? `Beitrag zu ${anime.title}`
            : "Beitrag in der Community",
          removed,
          deleted,
          post,
        };
      }
      if (type === "comment") {
        const comment = comments.find((entry) => entry.id === id);
        const removed = demo.removedCommentIds.includes(id);
        const deleted = !comment || demo.deletedCommentIds.includes(id);
        let context: string | undefined;
        let contextHref: string | undefined;
        if (comment?.target.type === "post") {
          const parent = posts.find(
            (post) => post.id === (comment.target as { postId: string }).postId,
          );
          const author = parent ? getUserByIdSync(parent.authorId) : undefined;
          context = `Kommentar zu einem Beitrag von ${author?.username ?? "Unbekannt"}`;
          contextHref = parent ? `/community/posts/${parent.id}` : undefined;
        } else if (comment?.target.type === "episode") {
          const episode = getEpisodeByIdSync(comment.target.episodeId);
          const anime = episode ? getAnimeByIdSync(episode.animeId) : undefined;
          if (episode && anime) {
            context = `Kommentar zu Episode ${episode.number} von ${anime.title}`;
            contextHref = episodeHref(anime.slug, episode);
          }
        }
        return {
          excerpt: comment?.body ?? "Kommentar wurde von der Person gelöscht.",
          authorId: comment?.authorId,
          href: !removed && !deleted ? contextHref : undefined,
          context,
          contextHref,
          removed,
          deleted,
          comment,
        };
      }
      const user = getUserByIdSync(id);
      return {
        excerpt: user
          ? `@${user.username} – ${user.bio ?? user.displayName}`
          : "Profil existiert nicht mehr.",
        authorId: user?.id,
        href: user ? `/u/${encodeURIComponent(user.username)}` : undefined,
        context: "Profil",
        removed: false,
        deleted: !user,
      };
    };
  }, [demo]);
}

export function useResolvedReports(): ResolvedReport[] {
  const { reports } = useDemoState();
  const clock = useClock();
  const resolve = useTargetResolver();
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const report of reports) {
      const key = `${report.targetType}:${report.targetId}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return reports
      .map((report) => ({
        ...report,
        time: resolveTime(report.createdAt, report.seeded, clock),
        handledTime: report.handledAt
          ? resolveTime(report.handledAt, report.seeded, clock)
          : undefined,
        target: resolve(report.targetType, report.targetId),
        targetReportCount:
          counts.get(`${report.targetType}:${report.targetId}`) ?? 1,
      }))
      .toSorted((a, b) => b.time - a.time);
  }, [reports, clock, resolve]);
}

export function useResolvedLog(): (ModerationLogEntry & { time: number })[] {
  const { moderationLog } = useDemoState();
  const clock = useClock();
  return useMemo(
    () =>
      moderationLog
        .map((entry) => ({
          ...entry,
          time: resolveTime(entry.createdAt, entry.seeded, clock),
        }))
        .toSorted((a, b) => b.time - a.time),
    [moderationLog, clock],
  );
}

/** Aktive Sperre eines Nutzers samt aufgelöstem Ende (für Anzeige). */
export function useActiveBan(
  userId: string | undefined,
): (UserBan & { untilTime: number | null }) | undefined {
  const { bans } = useDemoState();
  const clock = useClock();
  return useMemo(() => {
    if (!userId) return undefined;
    const ban = findActiveBan(bans, userId, clock.now, clock.shift);
    if (!ban) return undefined;
    return {
      ...ban,
      untilTime: ban.until
        ? Date.parse(ban.until) + (ban.seeded ? clock.shift : 0)
        : null,
    };
  }, [bans, clock, userId]);
}
