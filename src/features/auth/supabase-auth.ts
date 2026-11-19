"use client";

import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_HUES } from "@/features/profiles/avatar";
import {
  PROFILE_COLUMNS,
  type ProfileInput,
  type ProfileRow,
  type ProfileUpdate,
  UsernameTakenError,
  isMissingSchema,
  isUniqueViolation,
  rowToAccountFields,
  toProfileUpdate,
} from "@/features/profiles/profile-row";
import {
  type DemoAccount,
  demoActions,
  getDemoState,
} from "@/features/demo/store";
import { providersFromAppMetadata } from "@/features/auth/oauth";

/**
 * Anmeldung über Supabase Auth (E-Mail + Passwort).
 *
 * Die Sitzung liegt in Cookies (@supabase/ssr), der Proxy erneuert sie.
 * Profilangaben liegen in der Tabelle `profiles` (Schritt 2). Solange die
 * Migration nicht angewendet ist, nutzt die App weiter die Nutzer-Metadaten.
 * Der Demo-Store spiegelt das Konto für die Oberfläche.
 * Passwörter werden nur an Supabase übergeben und nirgends gespeichert.
 */

let client: SupabaseClient | null | undefined;

/** Ohne Client-Erzeugung prüfbar – auch beim Server-Rendering. */
export function isAuthConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/** `null`, wenn Supabase nicht konfiguriert ist (fehlende Umgebungsvariablen). */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  try {
    client = createClient();
  } catch {
    client = null;
  }
  return client;
}

/** Profil-Metadaten im Supabase-Konto: Startwerte für die Profilzeile und Ersatz ohne Tabelle. */
export type ProfileMetadata = {
  username?: string;
  display_name?: string;
  bio?: string | null;
  avatar_hue?: number;
  onboarding_complete?: boolean;
};

/** Baut das Konto aus dem Supabase-Nutzer; Werte aus der Profilzeile haben Vorrang. */
export function userToAccount(
  user: User,
  row?: ProfileRow | null,
): DemoAccount {
  const meta = (user.user_metadata ?? {}) as ProfileMetadata;
  const fallbackName = user.email?.split("@")[0] ?? "Mitglied";
  const account: DemoAccount = {
    id: user.id,
    email: user.email ?? "",
    username: meta.username ?? fallbackName,
    displayName: meta.display_name ?? meta.username ?? fallbackName,
    bio: meta.bio ?? undefined,
    avatarHue: meta.avatar_hue ?? AVATAR_HUES[0],
    emailVerified: Boolean(user.email_confirmed_at),
    onboardingComplete: Boolean(meta.onboarding_complete),
    createdAt: user.created_at,
    providers: providersFromAppMetadata(user.app_metadata),
  };
  return row ? { ...account, ...rowToAccountFields(row) } : account;
}

/** Übersetzt Supabase-Fehler in verständliche deutsche Meldungen. */
export function authErrorMessage(
  error: AuthError | Error | null | undefined,
): string {
  if (error instanceof UsernameTakenError) return error.message;
  const code = (error as AuthError | undefined)?.code;
  const status = (error as AuthError | undefined)?.status;
  switch (code) {
    case "invalid_credentials":
      return "E-Mail-Adresse oder Passwort ist nicht korrekt.";
    case "email_not_confirmed":
      return "Bitte bestätige zuerst deine E-Mail-Adresse. Den Link findest du in deinem Postfach.";
    case "user_already_exists":
    case "email_exists":
      return "Mit dieser E-Mail-Adresse gibt es bereits ein Konto.";
    case "weak_password":
      return "Dieses Passwort ist zu schwach. Wähle ein längeres oder weniger verbreitetes.";
    case "same_password":
      return "Das neue Passwort muss sich vom bisherigen unterscheiden.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Zu viele Versuche. Bitte warte kurz und versuche es dann erneut.";
    case "signup_disabled":
      return "Registrierungen sind gerade deaktiviert.";
    case "session_not_found":
    case "refresh_token_not_found":
      return "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.";
    case "otp_expired":
      return "Der Link ist abgelaufen. Fordere einen neuen an.";
  }
  if (status === 429)
    return "Zu viele Versuche. Bitte warte kurz und versuche es dann erneut.";
  if (error?.message?.toLowerCase().includes("fetch"))
    return "Keine Verbindung zum Anmeldedienst. Prüfe dein Internet.";
  return "Das hat nicht geklappt. Bitte versuche es erneut.";
}

const NOT_CONFIGURED = new Error("Supabase ist nicht konfiguriert.");

function requireClient(): SupabaseClient {
  const supabase = getSupabase();
  if (!supabase) throw NOT_CONFIGURED;
  return supabase;
}

/** Lädt die eigene Profilzeile; `null`, wenn sie fehlt oder die Tabelle noch nicht existiert. */
async function fetchProfileRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    if (!isMissingSchema(error))
      console.warn(
        "[profiles] Profil konnte nicht geladen werden:",
        error.message,
      );
    return null;
  }
  return data as ProfileRow | null;
}

/** Lädt das Profil nach und übernimmt es, solange derselbe Nutzer angemeldet ist. */
async function refreshProfile(supabase: SupabaseClient, user: User) {
  const row = await fetchProfileRow(supabase, user.id);
  const session = getDemoState().session;
  if (!row || session?.kind !== "supabase" || session.userId !== user.id)
    return;
  demoActions.applyAuthAccount(userToAccount(user, row));
}

/**
 * Prüft, ob ein Nutzername in der Datenbank frei ist. Gibt `true` zurück,
 * wenn Supabase fehlt oder die Migration noch nicht angewendet ist – dann
 * gilt nur die lokale Prüfung.
 */
export async function isUsernameAvailable(
  username: string,
  currentUsername?: string,
): Promise<boolean> {
  if (currentUsername?.toLowerCase() === username.toLowerCase()) return true;
  const supabase = getSupabase();
  if (!supabase) return true;
  const { data, error } = await supabase.rpc("username_available", {
    name: username,
  });
  if (error) {
    if (!isMissingSchema(error))
      console.warn(
        "[profiles] Nutzername konnte nicht geprüft werden:",
        error.message,
      );
    return true;
  }
  return data === true;
}

/**
 * Ändert das eigene Profil in der Tabelle. Ohne Tabelle landen die Werte
 * wie bisher in den Metadaten.
 */
async function updateOwnProfile(
  userId: string,
  update: ProfileUpdate,
  metadataFallback: ProfileMetadata,
) {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();
  if (error) {
    if (isUniqueViolation(error)) throw new UsernameTakenError();
    if (isMissingSchema(error)) {
      await saveProfileMetadata(metadataFallback);
      return;
    }
    throw error;
  }
  if (!data) throw new Error("Profil nicht gefunden.");
  const row = data as ProfileRow;
  const current = getDemoState().accounts.find((entry) => entry.id === row.id);
  if (current)
    demoActions.applyAuthAccount({ ...current, ...rowToAccountFields(row) });
}

/** Ziel der Bestätigungs- und Reset-Links (muss in Supabase als Redirect-URL erlaubt sein). */
function callbackUrl(next: string) {
  return `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export async function signUp(input: {
  email: string;
  password: string;
  username: string;
}) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      emailRedirectTo: callbackUrl("/onboarding"),
      data: {
        username: input.username,
        display_name: input.username,
        avatar_hue: AVATAR_HUES[Math.floor(Math.random() * AVATAR_HUES.length)],
        onboarding_complete: false,
      } satisfies ProfileMetadata,
    },
  });
  if (error) throw error;
  // Ohne Bestätigungspflicht kommt sofort eine Sitzung zurück.
  return { needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  const row = await fetchProfileRow(supabase, data.user.id);
  const account = userToAccount(data.user, row);
  demoActions.applyAuthAccount(account);
  return account;
}

/**
 * Startet die Anmeldung mit Google. Der Browser verlässt dabei die Seite;
 * zurück geht es über `/auth/confirm`, das neue Konten ins Onboarding schickt.
 */
export async function signInWithGoogle(next: string | null) {
  const supabase = requireClient();
  // signInWithOAuth leitet nur weiter und meldet keinen Fehler zurück. Ist
  // Google in Supabase nicht aktiviert, landete man auf einer rohen
  // Fehlerseite. Deshalb vorher die öffentlichen Auth-Einstellungen prüfen.
  if (!(await isGoogleEnabled()))
    throw new Error("Unsupported provider: provider is not enabled");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // provider=google: /auth/confirm meldet Fehler dann auf der Anmeldeseite.
    options: {
      redirectTo: `${callbackUrl(next ?? "/dashboard")}&provider=google`,
    },
  });
  if (error) throw error;
}

/** Liest aus `/auth/v1/settings`, ob Google als Anbieter aktiv ist. */
async function isGoogleEnabled(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  const response = await fetch(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
  });
  if (!response.ok) return false;
  const settings = (await response.json()) as {
    external?: Record<string, boolean>;
  };
  return settings.external?.google === true;
}

export async function resendConfirmation(email: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: callbackUrl("/onboarding") },
  });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: callbackUrl("/reset-password"),
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/** Prüft das aktuelle Passwort, indem es sich damit erneut anmeldet. */
export async function verifyPassword(email: string, password: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function updateEmail(email: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.updateUser(
    { email: email.trim() },
    { emailRedirectTo: callbackUrl("/settings/account") },
  );
  if (error) throw error;
}

export async function signOutOtherSessions() {
  const supabase = requireClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) throw error;
}

/** Speichert Profilangaben im Supabase-Konto und aktualisiert die Oberfläche. */
export async function saveProfileMetadata(data: ProfileMetadata) {
  const supabase = requireClient();
  const { data: result, error } = await supabase.auth.updateUser({ data });
  if (error) throw error;
  if (result.user) demoActions.applyAuthAccount(userToAccount(result.user));
}

/** Meldet ab – bei Supabase-Sitzungen auch serverseitig. */
export async function signOut() {
  const session = getDemoState().session;
  if (session?.kind === "supabase") {
    await getSupabase()?.auth.signOut();
  }
  demoActions.signOut();
}

/** Spiegelt Anmeldungen in den Store; einmal im DemoProvider starten. */
export function startAuthSync(): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    demoActions.markAuthReady();
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user = session.user;
      const state = getDemoState();
      const known =
        state.session?.kind === "supabase" && state.session.userId === user.id
          ? state.accounts.find((entry) => entry.id === user.id)
          : undefined;
      // Bekannte Profilwerte behalten, bis die Profilzeile geladen ist –
      // sonst springt die Oberfläche kurz auf ältere Metadaten zurück.
      const account = userToAccount(user);
      demoActions.applyAuthAccount(
        known
          ? {
              ...account,
              username: known.username,
              displayName: known.displayName,
              bio: known.bio,
              avatarHue: known.avatarHue,
              onboardingComplete: known.onboardingComplete,
            }
          : account,
      );
      // Keine Supabase-Aufrufe direkt im Callback (Gefahr einer Blockade),
      // deshalb das Profil im nächsten Durchlauf laden.
      setTimeout(() => void refreshProfile(supabase, user), 0);
    } else demoActions.clearAuthSession();
    demoActions.markAuthReady();
  });
  return () => data.subscription.unsubscribe();
}

export function isSupabaseSession() {
  return getDemoState().session?.kind === "supabase";
}

/** Profil speichern – bei Supabase-Konten in der Tabelle `profiles`, sonst lokal (Demo). */
export async function saveProfile(userId: string, profile: ProfileInput) {
  if (isSupabaseSession()) {
    await updateOwnProfile(userId, toProfileUpdate(profile), {
      display_name: profile.displayName,
      username: profile.username,
      bio: profile.bio ?? null,
      avatar_hue: profile.avatarHue,
    });
    return;
  }
  demoActions.updateProfile(userId, profile);
}

/** Onboarding abschließen – bei Supabase-Konten dauerhaft im Profil vermerkt. */
export async function finishOnboarding() {
  const session = getDemoState().session;
  if (session?.kind === "supabase") {
    await updateOwnProfile(
      session.userId,
      { onboarding_complete: true },
      { onboarding_complete: true },
    );
    return;
  }
  demoActions.completeOnboarding();
}
