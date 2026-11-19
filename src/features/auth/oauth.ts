/**
 * Anmeldung über externe Anbieter (Google). Spezifikation: docs/specs/google-login.md
 *
 * Reine Hilfsfunktionen ohne Supabase-Client. Sie laufen im Browser und in
 * der Route `/auth/confirm` und sind ohne Datenbank testbar.
 */

/** Werte für `?error=` auf der Anmeldeseite nach der Rückkehr von Google. */
export type OAuthLoginError = "oauth_cancelled" | "oauth_failed";

/**
 * Wertet die Fehlerparameter aus, mit denen Supabase nach einem
 * gescheiterten OAuth-Ablauf auf `/auth/confirm` zurückleitet.
 * `null`, wenn kein Fehler gemeldet wurde.
 */
export function oauthErrorFromParams(
  params: URLSearchParams,
): OAuthLoginError | null {
  const error = params.get("error");
  if (!error) return null;
  return error === "access_denied" ? "oauth_cancelled" : "oauth_failed";
}

/** Meldung auf der Anmeldeseite zu `?error=…`; `null` für unbekannte Werte. */
export function oauthLoginErrorMessage(value: string | null): string | null {
  switch (value) {
    case "oauth_cancelled":
      return "Die Anmeldung mit Google wurde abgebrochen. Du kannst es erneut versuchen.";
    case "oauth_failed":
      return "Die Anmeldung mit Google ist fehlgeschlagen. Bitte versuche es erneut.";
    default:
      return null;
  }
}

/** Meldung, wenn Supabase den Start der Google-Anmeldung ablehnt. */
export function oauthStartErrorMessage(
  error: { message?: string; status?: number } | null | undefined,
): string {
  const message = error?.message?.toLowerCase() ?? "";
  if (
    message.includes("provider is not enabled") ||
    message.includes("unsupported provider")
  )
    return "Die Anmeldung mit Google ist gerade nicht verfügbar.";
  if (message.includes("fetch"))
    return "Keine Verbindung zum Anmeldedienst. Prüfe dein Internet.";
  return "Die Anmeldung mit Google konnte nicht gestartet werden. Bitte versuche es erneut.";
}

/**
 * Ziel nach dem Einlösen eines Links oder der Rückkehr von Google: Wer das
 * Onboarding noch nicht abgeschlossen hat, richtet zuerst das Profil ein.
 * `onboardingComplete === null` heißt: unbekannt (z. B. Profiltabelle fehlt),
 * dann gilt das gewünschte Ziel. Der Passwort-Reset geht immer vor.
 */
export function destinationAfterCallback(
  next: string,
  onboardingComplete: boolean | null,
): string {
  if (next === "/reset-password") return next;
  if (onboardingComplete === false) return "/onboarding";
  return next;
}

/**
 * Anmeldewege eines Supabase-Kontos aus `app_metadata`, z. B. `["email"]`
 * oder `["email", "google"]`.
 */
export function providersFromAppMetadata(
  appMetadata: { provider?: unknown; providers?: unknown } | null | undefined,
): string[] {
  const list = Array.isArray(appMetadata?.providers)
    ? appMetadata.providers.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  if (list.length > 0) return list;
  return typeof appMetadata?.provider === "string"
    ? [appMetadata.provider]
    : [];
}

/**
 * Hat das Konto ein Passwort? Konten ohne bekannte Anbieter zählen als
 * E-Mail-Konten (ältere Stände kennen das Feld noch nicht).
 */
export function hasPasswordLogin(providers: string[] | undefined): boolean {
  return !providers || providers.length === 0 || providers.includes("email");
}
