/**
 * Tabelle `public.profiles` (siehe supabase/migrations und docs/specs/profiles.md).
 *
 * Reine Umwandlungen ohne Supabase-Client, damit sie ohne Browser und
 * Datenbank testbar sind.
 */

import type { UserProfile } from "@/features/profiles/types";

export type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_hue: number;
  onboarding_complete: boolean;
  role: "member" | "moderator";
  created_at: string;
  updated_at: string;
};

export const PROFILE_COLUMNS =
  "id, username, display_name, bio, avatar_hue, onboarding_complete, role, created_at, updated_at";

/** Spalten, die ein Nutzer selbst ändern darf (Spaltenrechte in der Migration). */
export type ProfileUpdate = Partial<
  Pick<
    ProfileRow,
    "username" | "display_name" | "bio" | "avatar_hue" | "onboarding_complete"
  >
>;

/** Eingaben aus dem Profilformular. */
export type ProfileInput = {
  displayName: string;
  username: string;
  bio?: string;
  avatarHue: number;
};

/** Profilangaben, wie die Oberfläche sie im Konto führt. */
export type ProfileAccountFields = {
  username: string;
  displayName: string;
  bio?: string;
  avatarHue: number;
  onboardingComplete: boolean;
};

export function toProfileUpdate(input: ProfileInput): ProfileUpdate {
  const bio = input.bio?.trim();
  return {
    username: input.username.trim(),
    display_name: input.displayName.trim(),
    bio: bio ? bio : null,
    avatar_hue: input.avatarHue,
  };
}

export function rowToAccountFields(row: ProfileRow): ProfileAccountFields {
  return {
    username: row.username,
    displayName: row.display_name,
    bio: row.bio ?? undefined,
    avatarHue: row.avatar_hue,
    onboardingComplete: row.onboarding_complete,
  };
}

/** Öffentliche Spalten für Profile anderer Nutzer (z. B. Autoren von Beiträgen). */
export type PublicProfileRow = Pick<
  ProfileRow,
  | "id"
  | "username"
  | "display_name"
  | "bio"
  | "avatar_hue"
  | "onboarding_complete"
  | "role"
  | "created_at"
>;

export const PUBLIC_PROFILE_COLUMNS =
  "id, username, display_name, bio, avatar_hue, onboarding_complete, role, created_at";

/** Profilzeile als `UserProfile` für Karten, Namen und Profilseiten. */
export function rowToUserProfile(row: PublicProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio ?? undefined,
    avatarHue: row.avatar_hue,
    role: row.role === "moderator" ? "moderator" : "member",
    badges: [],
    favoriteAnimeIds: [],
    joinedAt: row.created_at,
    profileComplete: row.onboarding_complete,
  };
}

export const USERNAME_TAKEN_MESSAGE = "Dieser Nutzername ist schon vergeben.";

/** Die Datenbank hat den Nutzernamen abgelehnt, weil er schon vergeben ist. */
export class UsernameTakenError extends Error {
  constructor() {
    super(USERNAME_TAKEN_MESSAGE);
    this.name = "UsernameTakenError";
  }
}

type DbError = { code?: string } | null | undefined;

/** `23505`: Ein eindeutiger Index wurde verletzt – hier der Nutzername. */
export function isUniqueViolation(error: DbError): boolean {
  return error?.code === "23505";
}

/**
 * Tabelle oder Funktion existiert noch nicht, weil die Migration nicht
 * angewendet ist. Die App nutzt dann weiter die Nutzer-Metadaten.
 */
export function isMissingSchema(error: DbError): boolean {
  return ["42P01", "42883", "PGRST202", "PGRST205"].includes(error?.code ?? "");
}
