import type { UserProfile } from "@/features/profiles/types";
import { demoFollows, demoUsers } from "@/data/demo/users";

/**
 * Datenzugriff für Profile. Später: Tabelle `profiles` in Supabase mit RLS.
 *
 * Im Demo-Modus registriert der lokale Store zusätzlich im Browser angelegte
 * Konten und Profiländerungen (`setLocalProfiles`). Auf dem Server sind nur
 * die Demo-Profile bekannt.
 */

let localUsers: UserProfile[] = [];
let overrides: Record<string, Partial<UserProfile>> = {};

export function setLocalProfiles(
  users: UserProfile[],
  profileOverrides: Record<string, Partial<UserProfile>>,
) {
  localUsers = users;
  overrides = profileOverrides;
}

function withOverrides(user: UserProfile | undefined) {
  if (!user) return undefined;
  const override = overrides[user.id];
  return override ? { ...user, ...override } : user;
}

export function listUsersSync(): UserProfile[] {
  return [...demoUsers, ...localUsers].map((user) => withOverrides(user)!);
}

export function getUserByIdSync(id: string): UserProfile | undefined {
  return withOverrides(
    demoUsers.find((user) => user.id === id) ??
      localUsers.find((user) => user.id === id),
  );
}

export function getUserByUsernameSync(
  username: string,
): UserProfile | undefined {
  const normalized = username.toLowerCase();
  return listUsersSync().find(
    (user) => user.username.toLowerCase() === normalized,
  );
}

export function isUsernameTaken(username: string, exceptUserId?: string) {
  const user = getUserByUsernameSync(username);
  return Boolean(user && user.id !== exceptUserId);
}

export function getBaseFollowerIds(userId: string): string[] {
  return demoFollows
    .filter(([, followee]) => followee === userId)
    .map(([follower]) => follower);
}

export function getBaseFollowingIds(userId: string): string[] {
  return demoFollows
    .filter(([follower]) => follower === userId)
    .map(([, followee]) => followee);
}
