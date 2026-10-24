"use client";

import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AVATAR_HUES } from "@/features/profiles/avatar";
import {
  type DemoAccount,
  demoActions,
  getDemoState,
} from "@/features/demo/store";

/**
 * Anmeldung über Supabase Auth (E-Mail + Passwort).
 *
 * Die Sitzung liegt in Cookies (@supabase/ssr), der Proxy erneuert sie.
 * Profilangaben stehen bis zur Profiltabelle (Schritt 2) in den
 * Nutzer-Metadaten; der Demo-Store spiegelt sie für die Oberfläche.
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

/** Profil-Metadaten, die ANIMORA im Supabase-Konto ablegt. */
export type ProfileMetadata = {
  username?: string;
  display_name?: string;
  bio?: string | null;
  avatar_hue?: number;
  onboarding_complete?: boolean;
};

export function userToAccount(user: User): DemoAccount {
  const meta = (user.user_metadata ?? {}) as ProfileMetadata;
  const fallbackName = user.email?.split("@")[0] ?? "Mitglied";
  return {
    id: user.id,
    email: user.email ?? "",
    username: meta.username ?? fallbackName,
    displayName: meta.display_name ?? meta.username ?? fallbackName,
    bio: meta.bio ?? undefined,
    avatarHue: meta.avatar_hue ?? AVATAR_HUES[0],
    emailVerified: Boolean(user.email_confirmed_at),
    onboardingComplete: Boolean(meta.onboarding_complete),
    createdAt: user.created_at,
  };
}

/** Übersetzt Supabase-Fehler in verständliche deutsche Meldungen. */
export function authErrorMessage(
  error: AuthError | Error | null | undefined,
): string {
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
  const account = userToAccount(data.user);
  demoActions.applyAuthAccount(account);
  return account;
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
    if (session?.user)
      demoActions.applyAuthAccount(userToAccount(session.user));
    else demoActions.clearAuthSession();
    demoActions.markAuthReady();
  });
  return () => data.subscription.unsubscribe();
}

export function isSupabaseSession() {
  return getDemoState().session?.kind === "supabase";
}

/** Profil speichern – bei Supabase-Konten in den Metadaten, sonst lokal (Demo). */
export async function saveProfile(
  userId: string,
  profile: {
    displayName: string;
    username: string;
    bio?: string;
    avatarHue: number;
  },
) {
  if (isSupabaseSession()) {
    await saveProfileMetadata({
      display_name: profile.displayName,
      username: profile.username,
      bio: profile.bio ?? null,
      avatar_hue: profile.avatarHue,
    });
    return;
  }
  demoActions.updateProfile(userId, profile);
}

/** Onboarding abschließen – bei Supabase-Konten dauerhaft im Konto vermerkt. */
export async function finishOnboarding() {
  if (isSupabaseSession()) {
    await saveProfileMetadata({ onboarding_complete: true });
    return;
  }
  demoActions.completeOnboarding();
}
