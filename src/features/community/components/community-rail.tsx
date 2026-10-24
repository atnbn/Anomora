"use client";

import Link from "next/link";
import { HeartIcon, MessageCircleIcon } from "lucide-react";
import { Panel } from "@/components/layout/section";
import { RelativeTime } from "@/components/feedback/relative-time";
import { type ResolvedPost, usePosts } from "@/features/community/hooks";
import { postHref } from "@/features/community/components/post-card";
import { FollowButton } from "@/features/profiles/components/follow-button";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { profileHref } from "@/features/profiles/components/user-name";
import { useDemoState } from "@/features/demo/store";
import { getUserByIdSync, listUsersSync } from "@/lib/data/users";
import { formatCount } from "@/lib/format";

function RailHeading({
  id,
  children,
  href,
}: {
  id: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <h2 id={id} className="text-[0.9375rem] font-bold">
        {children}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Alle anzeigen
        </Link>
      )}
    </div>
  );
}

export function CompactPostLink({ post }: { post: ResolvedPost }) {
  const author = getUserByIdSync(post.authorId);
  return (
    <Link
      href={postHref(post.id)}
      className="block rounded-md px-4 py-3 hover:bg-accent"
    >
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <UserAvatar user={author} size="xs" />
        <span className="truncate font-semibold text-foreground">
          {author?.username}
        </span>
        <span aria-hidden="true">·</span>
        <RelativeTime time={post.time} className="shrink-0" />
      </span>
      <span className="mt-1.5 line-clamp-2 text-sm leading-snug">
        {post.containsSpoiler
          ? "Spoiler-Beitrag – zum Lesen öffnen"
          : post.body}
      </span>
      <span className="mt-1.5 flex gap-3 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <HeartIcon className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Likes:</span>
          {formatCount(post.likeCount)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircleIcon className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Kommentare:</span>
          {formatCount(post.commentCount)}
        </span>
      </span>
    </Link>
  );
}

export function PopularPostsPanel({ limit = 4 }: { limit?: number }) {
  const posts = usePosts()
    .toSorted(
      (a, b) =>
        b.likeCount + b.commentCount * 5 - (a.likeCount + a.commentCount * 5),
    )
    .slice(0, limit);

  return (
    <Panel as="section" labelledBy="rail-popular" className="pb-2">
      <RailHeading id="rail-popular" href="/community">
        Beliebt in der Community
      </RailHeading>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <CompactPostLink post={post} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function SuggestedUsersPanel() {
  const { session, blockedUserIds, following } = useDemoState();
  const suggestions = listUsersSync()
    .filter(
      (user) =>
        user.id !== session?.userId &&
        !blockedUserIds.includes(user.id) &&
        !following.includes(user.id) &&
        user.profileComplete &&
        user.username !== "AnimoraTeam",
    )
    .slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <Panel as="section" labelledBy="rail-suggested" className="pb-2">
      <RailHeading id="rail-suggested">Vorgeschlagene Mitglieder</RailHeading>
      <ul>
        {suggestions.map((user) => (
          <li key={user.id} className="flex items-center gap-3 px-4 py-2.5">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0 flex-1">
              <Link
                href={profileHref(user)}
                className="block truncate text-sm font-semibold hover:underline"
              >
                {user.username}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {user.bio ?? user.displayName}
              </p>
            </div>
            <FollowButton user={user} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
