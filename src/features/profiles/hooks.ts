"use client";

import { useMemo } from "react";
import type { UserProfile } from "@/features/profiles/types";
import { useDemoState } from "@/features/demo/store";
import {
  getBaseFollowerIds,
  getBaseFollowingIds,
  getUserByIdSync,
} from "@/lib/data/users";

/** Der angemeldete Nutzer (Demo) inklusive lokal geänderter Favoriten. */
export function useViewer(): { viewer: UserProfile | null; hydrated: boolean } {
  const { session, favorites, hydrated, accounts, profileOverrides } =
    useDemoState();
  return useMemo(() => {
    const base = session ? getUserByIdSync(session.userId) : undefined;
    return {
      viewer: base ? { ...base, favoriteAnimeIds: favorites } : null,
      hydrated,
    };
    // accounts und profileOverrides ändern das Ergebnis von getUserByIdSync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, favorites, hydrated, accounts, profileOverrides]);
}

/**
 * Follower und Gefolgt-Listen inklusive eigener Änderungen.
 * Die Beziehungen des angemeldeten Kontos stammen aus dem lokalen Store,
 * alle anderen aus den Demo-Daten. Blockierte Personen werden ausgeblendet.
 */
export function useFollowStats(userId: string) {
  const { following, session, blockedUserIds } = useDemoState();
  return useMemo(() => {
    const viewerId = session?.userId;
    const visible = (id: string) => !blockedUserIds.includes(id);
    const baseFollowers = getBaseFollowerIds(userId).filter(
      (id) => id !== viewerId,
    );
    const followers =
      viewerId && following.includes(userId)
        ? [...baseFollowers, viewerId]
        : baseFollowers;
    const followingIds =
      viewerId === userId ? following : getBaseFollowingIds(userId);
    return {
      followers: followers.filter(visible),
      following: followingIds.filter(visible),
      isFollowing: Boolean(viewerId) && following.includes(userId),
    };
  }, [following, session, userId, blockedUserIds]);
}
