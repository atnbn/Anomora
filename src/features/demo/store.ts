"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { Comment, Post } from "@/features/community/types";
import type { UserProfile } from "@/features/profiles/types";
import type {
  DemoReport,
  ModerationAction,
  ModerationLogEntry,
  ReportStatus,
  ReportTargetType,
  UserBan,
} from "@/features/moderation/types";
import {
  DEMO_LOGIN_EMAIL,
  DEMO_MOD_EMAIL,
  DEMO_MOD_ID,
  DEMO_VIEWER_ID,
  demoFollows,
  demoUsers,
} from "@/data/demo/users";
import {
  demoBans,
  demoModerationLog,
  demoReports,
} from "@/data/demo/moderation";
import { getUserByIdSync, setLocalProfiles } from "@/lib/data/users";
import { formatDateTime } from "@/lib/format";

export type { DemoReport, ReportReason } from "@/features/moderation/types";

/**
 * Lokaler Demo-Store für alle Nutzerinteraktionen.
 *
 * Simuliert, was später Supabase übernimmt: Sitzung, Favoriten, Beiträge,
 * Likes, Kommentare und Folgen. Gespeichert wird ausschließlich im
 * localStorage dieses Browsers – keine Passwörter, Tokens oder Geheimnisse.
 * Lokal registrierte Konten speichern nur E-Mail und Profildaten.
 */

/**
 * `supabase`: echte Anmeldung (Sitzung in Supabase-Cookies, hier gespiegelt).
 * `demo`: vorgegebenes Demo-Konto ohne Anmeldung.
 */
export type DemoSession = { userId: string; kind: "demo" | "supabase" };

export type DemoPreferences = {
  spoilerProtection: boolean;
};

/** Spiegel eines Supabase-Kontos (Profil aus den Nutzer-Metadaten) – ohne Passwort oder Token. */
export type DemoAccount = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarHue: number;
  emailVerified: boolean;
  onboardingComplete: boolean;
  createdAt: string;
};

/** Persönliche Listen je Konto, damit ein Kontowechsel sie nicht vermischt. */
type UserLists = Pick<
  DemoState,
  "favorites" | "following" | "watchedEpisodeIds"
>;

export type DemoState = {
  session: DemoSession | null;
  accounts: DemoAccount[];
  profileOverrides: Record<string, Partial<UserProfile>>;
  userLists: Record<string, UserLists>;
  /** E-Mail einer Registrierung, die noch bestätigt werden muss. */
  pendingEmail: string | null;
  reports: DemoReport[];
  bans: UserBan[];
  moderationLog: ModerationLogEntry[];
  /** Durch Moderation entfernte Inhalte – für alle unsichtbar. */
  removedPostIds: string[];
  removedCommentIds: string[];
  favorites: string[];
  following: string[];
  watchedEpisodeIds: string[];
  createdPosts: Post[];
  postEdits: Record<
    string,
    Pick<Post, "body" | "containsSpoiler" | "editedAt">
  >;
  deletedPostIds: string[];
  likedPostIds: string[];
  savedPostIds: string[];
  createdComments: Comment[];
  deletedCommentIds: string[];
  likedCommentIds: string[];
  blockedUserIds: string[];
  preferences: DemoPreferences;
};

type RuntimeState = DemoState & {
  /** true, sobald der gespeicherte Zustand aus dem Browser geladen wurde. */
  hydrated: boolean;
  /** Grund, warum eine Anmeldung nötig ist; öffnet den Anmelde-Hinweis. */
  authPrompt: string | null;
  /** true, sobald Supabase die (ggf. leere) Sitzung gemeldet hat. */
  authReady: boolean;
};

const STORAGE_KEY = "animora.demo.v1";

/** Startlisten: Demo-Konten bringen ihre Favoriten und Gefolgten aus den Seeds mit. */
function defaultListsFor(userId: string): UserLists {
  const seedUser = demoUsers.find((user) => user.id === userId);
  return {
    favorites: seedUser?.favoriteAnimeIds ?? [],
    following: demoFollows
      .filter(([follower]) => follower === userId)
      .map(([, followee]) => followee),
    watchedEpisodeIds:
      userId === DEMO_VIEWER_ID
        ? ["one-piece-1155", "frieren-33", "frieren-34", "detektiv-conan-1184"]
        : [],
  };
}

function createInitialState(): DemoState {
  return {
    // Neue Besucher starten abgemeldet; „Demo ansehen“ meldet das Demo-Konto an.
    session: null,
    accounts: [],
    profileOverrides: {},
    userLists: {},
    pendingEmail: null,
    reports: demoReports,
    bans: demoBans,
    moderationLog: demoModerationLog,
    removedPostIds: [],
    removedCommentIds: [],
    ...defaultListsFor(DEMO_VIEWER_ID),
    createdPosts: [],
    postEdits: {},
    deletedPostIds: [],
    likedPostIds: ["p-frieren-fanart"],
    savedPostIds: [],
    createdComments: [],
    deletedCommentIds: [],
    likedCommentIds: [],
    blockedUserIds: [],
    preferences: { spoilerProtection: true },
  };
}

const serverState: RuntimeState = {
  ...createInitialState(),
  hydrated: false,
  authPrompt: null,
  authReady: false,
};

let state: RuntimeState = serverState;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    const persisted: Partial<RuntimeState> = { ...state };
    delete persisted.hydrated;
    delete persisted.authPrompt;
    delete persisted.authReady;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // Privater Modus oder voller Speicher: Demo läuft ohne Persistenz weiter.
  }
}

function accountToProfile(account: DemoAccount): UserProfile {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    bio: account.bio,
    avatarHue: account.avatarHue,
    role: "member",
    badges: [],
    favoriteAnimeIds: [],
    joinedAt: account.createdAt,
    profileComplete: account.onboardingComplete,
  };
}

function syncProfiles() {
  setLocalProfiles(
    state.accounts.map(accountToProfile),
    state.profileOverrides,
  );
}

export function setDemoState(
  update: (current: RuntimeState) => Partial<RuntimeState>,
) {
  state = { ...state, ...update(state) };
  syncProfiles();
  if (state.hydrated) persist();
  emit();
}

/** Sichert die Listen des aktuellen Kontos und lädt die des neuen. */
function switchSession(
  userId: string | null,
  kind: DemoSession["kind"] = "demo",
): Partial<RuntimeState> {
  const userLists = { ...state.userLists };
  if (state.session) {
    userLists[state.session.userId] = {
      favorites: state.favorites,
      following: state.following,
      watchedEpisodeIds: state.watchedEpisodeIds,
    };
  }
  if (!userId) return { session: null, userLists };
  return {
    session: { userId, kind },
    userLists,
    ...(userLists[userId] ?? defaultListsFor(userId)),
    authPrompt: null,
  };
}

/** Lädt den gespeicherten Zustand; wird einmal im DemoProvider aufgerufen. */
export function hydrateDemoState() {
  if (state.hydrated) return;
  let stored: Partial<DemoState> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as Partial<DemoState>;
  } catch {
    stored = {};
  }
  state = {
    ...createInitialState(),
    ...stored,
    preferences: { ...createInitialState().preferences, ...stored.preferences },
    // Ältere Stände kennen `kind` noch nicht – das waren immer Demo-Sitzungen.
    session: stored.session
      ? { ...stored.session, kind: stored.session.kind ?? "demo" }
      : null,
    hydrated: true,
    authPrompt: null,
    authReady: state.authReady,
  };
  syncProfiles();
  emit();
}

export function resetDemoState() {
  state = {
    ...createInitialState(),
    hydrated: true,
    authPrompt: null,
    authReady: state.authReady,
  };
  syncProfiles();
  persist();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDemoState(): RuntimeState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

export function getDemoState(): RuntimeState {
  return state;
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id)
    ? list.filter((entry) => entry !== id)
    : [...list, id];
}

/** Gibt true zurück, wenn eine Sitzung besteht; sonst öffnet sich der Anmelde-Hinweis. */
export function requireSession(reason: string): boolean {
  if (state.session) return true;
  setDemoState(() => ({ authPrompt: reason }));
  return false;
}

/** Aktive Sperre eines Nutzers zum Zeitpunkt `now` (Demo-Sperren werden mit der Uhr verschoben). */
export function findActiveBan(
  bans: UserBan[],
  userId: string,
  now: number,
  shift = 0,
): UserBan | undefined {
  return bans.find(
    (ban) =>
      ban.userId === userId &&
      (ban.until === null ||
        Date.parse(ban.until) + (ban.seeded ? shift : 0) > now),
  );
}

/** Wie requireSession, verhindert aber zusätzlich Beiträge gesperrter Konten. */
export function requireCanPost(reason: string): boolean {
  if (!requireSession(reason)) return false;
  const ban = findActiveBan(state.bans, state.session!.userId, Date.now());
  if (!ban) return true;
  toast.error("Dein Konto ist gesperrt", {
    description: ban.until
      ? `Du kannst bis ${formatDateTime(Date.parse(ban.until))} Uhr nichts veröffentlichen. Grund: ${ban.reason}`
      : `Du kannst nichts mehr veröffentlichen. Grund: ${ban.reason}`,
  });
  return false;
}

export function isModerator(userId: string | undefined): boolean {
  return Boolean(userId && getUserByIdSync(userId)?.role === "moderator");
}

function logEntry(
  action: ModerationAction,
  targetType: ReportTargetType,
  targetId: string,
  extra: { reportId?: string; note?: string } = {},
): ModerationLogEntry {
  return {
    id: createId("l"),
    action,
    moderatorId: state.session?.userId ?? "unbekannt",
    targetType,
    targetId,
    ...extra,
    note: extra.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
}

/** Schließt offene Meldungen zu einem Ziel als erledigt ab. */
function resolveReportsFor(
  reports: DemoReport[],
  targetType: ReportTargetType,
  targetId: string,
): DemoReport[] {
  const now = new Date().toISOString();
  return reports.map((report) =>
    report.status === "open" &&
    report.targetType === targetType &&
    report.targetId === targetId
      ? {
          ...report,
          status: "resolved",
          handledBy: state.session?.userId,
          handledAt: now,
        }
      : report,
  );
}

let idCounter = 0;
function createId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export type AccountStatus = {
  userId: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
};

export function getAccountStatus(userId: string): AccountStatus {
  const account = state.accounts.find((entry) => entry.id === userId);
  if (account) {
    return {
      userId,
      emailVerified: account.emailVerified,
      onboardingComplete: account.onboardingComplete,
    };
  }
  return {
    userId,
    emailVerified: true,
    onboardingComplete: state.profileOverrides[userId]?.profileComplete ?? true,
  };
}

export function getAccountEmail(userId: string): string | undefined {
  if (userId === DEMO_VIEWER_ID) return DEMO_LOGIN_EMAIL;
  if (userId === DEMO_MOD_ID) return DEMO_MOD_EMAIL;
  return state.accounts.find((entry) => entry.id === userId)?.email;
}

export const demoActions = {
  /** Meldet ein vorgegebenes Demo-Konto an (ohne Supabase). */
  signIn(userId: string = DEMO_VIEWER_ID) {
    setDemoState(() => switchSession(userId, "demo"));
  },
  /** Lokale Abmeldung; für Supabase-Sitzungen `signOut` aus features/auth nutzen. */
  signOut() {
    setDemoState(() => switchSession(null));
  },
  /** Übernimmt das angemeldete Supabase-Konto (von onAuthStateChange). */
  applyAuthAccount(account: DemoAccount) {
    setDemoState((current) => {
      const accounts = [
        ...current.accounts.filter((entry) => entry.id !== account.id),
        account,
      ];
      const sameSession =
        current.session?.userId === account.id &&
        current.session.kind === "supabase";
      return {
        accounts,
        pendingEmail: null,
        ...(sameSession ? {} : switchSession(account.id, "supabase")),
      };
    });
  },
  /** Supabase-Sitzung ist weg (abgemeldet oder abgelaufen). */
  clearAuthSession() {
    if (state.session?.kind !== "supabase") return;
    setDemoState(() => switchSession(null));
  },
  markAuthReady() {
    if (!state.authReady) setDemoState(() => ({ authReady: true }));
  },
  setPendingEmail(email: string | null) {
    setDemoState(() => ({ pendingEmail: email }));
  },
  updateProfile(
    userId: string,
    profile: Partial<
      Pick<UserProfile, "username" | "displayName" | "bio" | "avatarHue">
    >,
  ) {
    setDemoState((current) => {
      if (current.accounts.some((account) => account.id === userId)) {
        return {
          accounts: current.accounts.map((account) =>
            account.id === userId ? { ...account, ...profile } : account,
          ),
        };
      }
      return {
        profileOverrides: {
          ...current.profileOverrides,
          [userId]: { ...current.profileOverrides[userId], ...profile },
        },
      };
    });
  },
  setFavorites(animeIds: string[]) {
    setDemoState(() => ({ favorites: animeIds }));
  },
  completeOnboarding() {
    const userId = state.session?.userId;
    if (!userId) return;
    setDemoState((current) => {
      if (current.accounts.some((account) => account.id === userId)) {
        return {
          accounts: current.accounts.map((account) =>
            account.id === userId
              ? { ...account, onboardingComplete: true }
              : account,
          ),
        };
      }
      return {
        profileOverrides: {
          ...current.profileOverrides,
          [userId]: {
            ...current.profileOverrides[userId],
            profileComplete: true,
          },
        },
      };
    });
  },
  closeAuthPrompt() {
    setDemoState(() => ({ authPrompt: null }));
  },
  toggleFavorite(animeId: string) {
    setDemoState((current) => ({
      favorites: toggle(current.favorites, animeId),
    }));
  },
  toggleFollow(userId: string) {
    setDemoState((current) => ({
      following: toggle(current.following, userId),
    }));
  },
  toggleWatched(episodeId: string) {
    setDemoState((current) => ({
      watchedEpisodeIds: toggle(current.watchedEpisodeIds, episodeId),
    }));
  },
  togglePostLike(postId: string) {
    setDemoState((current) => ({
      likedPostIds: toggle(current.likedPostIds, postId),
    }));
  },
  togglePostSaved(postId: string) {
    setDemoState((current) => ({
      savedPostIds: toggle(current.savedPostIds, postId),
    }));
  },
  toggleCommentLike(commentId: string) {
    setDemoState((current) => ({
      likedCommentIds: toggle(current.likedCommentIds, commentId),
    }));
  },
  createPost(
    input: Pick<
      Post,
      "body" | "animeId" | "category" | "containsSpoiler" | "media"
    >,
  ) {
    const session = state.session;
    if (!session) return undefined;
    const post: Post = {
      ...input,
      id: createId("p"),
      authorId: session.userId,
      createdAt: new Date().toISOString(),
      baseLikeCount: 0,
    };
    setDemoState((current) => ({
      createdPosts: [post, ...current.createdPosts],
    }));
    return post;
  },
  updatePost(postId: string, input: Pick<Post, "body" | "containsSpoiler">) {
    const editedAt = new Date().toISOString();
    setDemoState((current) => {
      const own = current.createdPosts.find((post) => post.id === postId);
      if (own) {
        return {
          createdPosts: current.createdPosts.map((post) =>
            post.id === postId ? { ...post, ...input, editedAt } : post,
          ),
        };
      }
      return {
        postEdits: { ...current.postEdits, [postId]: { ...input, editedAt } },
      };
    });
  },
  deletePost(postId: string) {
    setDemoState((current) => ({
      createdPosts: current.createdPosts.filter((post) => post.id !== postId),
      deletedPostIds: [...current.deletedPostIds, postId],
    }));
  },
  createComment(
    input: Pick<Comment, "body" | "target" | "parentId" | "containsSpoiler">,
  ) {
    const session = state.session;
    if (!session) return undefined;
    const comment: Comment = {
      ...input,
      id: createId("c"),
      authorId: session.userId,
      createdAt: new Date().toISOString(),
      baseLikeCount: 0,
    };
    setDemoState((current) => ({
      createdComments: [...current.createdComments, comment],
    }));
    return comment;
  },
  deleteComment(commentId: string) {
    setDemoState((current) => ({
      createdComments: current.createdComments.filter(
        (comment) => comment.id !== commentId,
      ),
      deletedCommentIds: [...current.deletedCommentIds, commentId],
    }));
  },
  report(
    input: Pick<DemoReport, "targetType" | "targetId" | "reason" | "note">,
  ) {
    const session = state.session;
    if (!session) return;
    const report: DemoReport = {
      ...input,
      id: createId("r"),
      reporterId: session.userId,
      createdAt: new Date().toISOString(),
      status: "open",
    };
    setDemoState((current) => ({ reports: [report, ...current.reports] }));
  },
  setReportStatus(
    reportId: string,
    status: Exclude<ReportStatus, "open">,
    note?: string,
  ) {
    const report = state.reports.find((entry) => entry.id === reportId);
    if (!report || !isModerator(state.session?.userId)) return;
    const entry = logEntry(
      status === "resolved" ? "resolve_report" : "dismiss_report",
      report.targetType,
      report.targetId,
      { reportId, note },
    );
    setDemoState((current) => ({
      reports: current.reports.map((item) =>
        item.id === reportId
          ? {
              ...item,
              status,
              handledBy: entry.moderatorId,
              handledAt: entry.createdAt,
            }
          : item,
      ),
      moderationLog: [entry, ...current.moderationLog],
    }));
  },
  reopenReport(reportId: string) {
    if (!isModerator(state.session?.userId)) return;
    setDemoState((current) => ({
      reports: current.reports.map((item) =>
        item.id === reportId
          ? {
              ...item,
              status: "open",
              handledBy: undefined,
              handledAt: undefined,
            }
          : item,
      ),
    }));
  },
  removeContent(
    targetType: "post" | "comment",
    targetId: string,
    options: { reportId?: string; note?: string } = {},
  ) {
    if (!isModerator(state.session?.userId)) return;
    const entry = logEntry("remove_content", targetType, targetId, options);
    setDemoState((current) => ({
      removedPostIds:
        targetType === "post"
          ? [...new Set([...current.removedPostIds, targetId])]
          : current.removedPostIds,
      removedCommentIds:
        targetType === "comment"
          ? [...new Set([...current.removedCommentIds, targetId])]
          : current.removedCommentIds,
      reports: resolveReportsFor(current.reports, targetType, targetId),
      moderationLog: [entry, ...current.moderationLog],
    }));
  },
  restoreContent(
    targetType: "post" | "comment",
    targetId: string,
    note?: string,
  ) {
    if (!isModerator(state.session?.userId)) return;
    const entry = logEntry("restore_content", targetType, targetId, { note });
    setDemoState((current) => ({
      removedPostIds: current.removedPostIds.filter((id) => id !== targetId),
      removedCommentIds: current.removedCommentIds.filter(
        (id) => id !== targetId,
      ),
      moderationLog: [entry, ...current.moderationLog],
    }));
  },
  banUser(
    userId: string,
    options: {
      until: string | null;
      reason: string;
      durationLabel: string;
      reportId?: string;
    },
  ) {
    const moderatorId = state.session?.userId;
    if (!moderatorId || !isModerator(moderatorId) || isModerator(userId))
      return;
    const entry = logEntry("ban_user", "user", userId, {
      reportId: options.reportId,
      note: `Sperre ${options.durationLabel}: ${options.reason}`,
    });
    const ban: UserBan = {
      userId,
      until: options.until,
      reason: options.reason.trim(),
      bannedBy: moderatorId,
      bannedAt: entry.createdAt,
    };
    setDemoState((current) => ({
      bans: [...current.bans.filter((item) => item.userId !== userId), ban],
      reports: options.reportId
        ? current.reports.map((item) =>
            item.id === options.reportId
              ? {
                  ...item,
                  status: "resolved",
                  handledBy: moderatorId,
                  handledAt: entry.createdAt,
                }
              : item,
          )
        : current.reports,
      moderationLog: [entry, ...current.moderationLog],
    }));
  },
  unbanUser(userId: string, note?: string) {
    if (!isModerator(state.session?.userId)) return;
    const entry = logEntry("unban_user", "user", userId, { note });
    setDemoState((current) => ({
      bans: current.bans.filter((item) => item.userId !== userId),
      moderationLog: [entry, ...current.moderationLog],
    }));
  },
  toggleBlock(userId: string) {
    setDemoState((current) => ({
      blockedUserIds: toggle(current.blockedUserIds, userId),
      following: current.following.filter((id) => id !== userId),
    }));
  },
  setPreference<K extends keyof DemoPreferences>(
    key: K,
    value: DemoPreferences[K],
  ) {
    setDemoState((current) => ({
      preferences: { ...current.preferences, [key]: value },
    }));
  },
};
