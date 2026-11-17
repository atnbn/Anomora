import type { UserProfile } from "@/features/profiles/types";
import { demoFollows, demoUsers } from "@/data/demo/users";

/**
 * Datenzugriff für Profile.
 *
 * - Demo-Profile aus den Seeds (auch auf dem Server bekannt)
 * - lokale Konten: im Browser angelegte Demo-Konten und das eigene
 *   Supabase-Konto (`setLocalProfiles`, vom Demo-Store gesetzt)
 * - entfernte Profile: andere echte Nutzer aus der Tabelle `profiles`, z. B.
 *   Autoren geladener Beiträge (`registerRemoteProfiles`)
 *
 * Auf dem Server sind nur die Demo-Profile bekannt.
 */

let localUsers: UserProfile[] = [];
let overrides: Record<string, Partial<UserProfile>> = {};
const remoteUsers = new Map<string, UserProfile>();
const remoteListeners = new Set<() => void>();
let remoteVersion = 0;

export function setLocalProfiles(
  users: UserProfile[],
  profileOverrides: Record<string, Partial<UserProfile>>,
) {
  localUsers = users;
  overrides = profileOverrides;
}

/** Merkt sich Profile anderer echter Nutzer und benachrichtigt Abonnenten. */
export function registerRemoteProfiles(users: UserProfile[]) {
  let changed = false;
  for (const user of users) {
    const current = remoteUsers.get(user.id);
    if (
      current &&
      current.username === user.username &&
      current.displayName === user.displayName &&
      current.bio === user.bio &&
      current.avatarHue === user.avatarHue &&
      current.role === user.role &&
      current.profileComplete === user.profileComplete
    )
      continue;
    remoteUsers.set(user.id, user);
    changed = true;
  }
  if (!changed) return;
  remoteVersion += 1;
  for (const listener of remoteListeners) listener();
}

export function subscribeRemoteProfiles(listener: () => void) {
  remoteListeners.add(listener);
  return () => remoteListeners.delete(listener);
}

export function getRemoteProfilesVersion() {
  return remoteVersion;
}

function withOverrides(user: UserProfile | undefined) {
  if (!user) return undefined;
  const override = overrides[user.id];
  return override ? { ...user, ...override } : user;
}

export function listUsersSync(): UserProfile[] {
  const known = new Set([...demoUsers, ...localUsers].map((user) => user.id));
  const remote = [...remoteUsers.values()].filter(
    (user) => !known.has(user.id),
  );
  return [...demoUsers, ...localUsers, ...remote].map((user) =>
    withOverrides(user)!,
  );
}

export function getUserByIdSync(id: string): UserProfile | undefined {
  return withOverrides(
    demoUsers.find((user) => user.id === id) ??
      localUsers.find((user) => user.id === id) ??
      remoteUsers.get(id),
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
