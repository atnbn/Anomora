import type { AuthError, EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/validation/auth";
import {
  type OAuthLoginError,
  destinationAfterCallback,
  oauthErrorFromParams,
} from "@/features/auth/oauth";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Ziel der Links aus Bestätigungs-, Reset- und E-Mail-Änderungs-Mails.
 *
 * - `code` (PKCE, Standard von @supabase/ssr): wird gegen eine Sitzung
 *   getauscht; funktioniert nur im Browser, in dem der Link angefordert wurde.
 * - `token_hash` + `type`: für angepasste E-Mail-Vorlagen, browserunabhängig.
 * - Rückkehr von Google (`code` mit `provider=google`): Abbruch und Fehler
 *   führen zurück auf die Anmeldeseite (`/login?error=…`).
 *
 * Konten ohne abgeschlossenes Onboarding landen zuerst im Onboarding.
 *
 * Weitergeleitet wird nur auf interne Pfade (`next`), nie auf fremde Seiten.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeRedirect(params.get("next"), "/dashboard");
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const isRecovery = next === "/reset-password";
  const failure = new URL("/verify-email?status=invalid", request.url);
  if (isRecovery) failure.pathname = "/reset-password";

  // Rückkehr von Google: Abbruch oder Fehler gehören auf die Anmeldeseite.
  const oauthError = oauthErrorFromParams(params);
  const viaOAuth = params.get("provider") === "google" || oauthError !== null;
  if (oauthError) return loginWithError(oauthError, request);

  try {
    const supabase = await createClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error)
        return redirect(await destinationFor(supabase, next), request);
      logFailure(error);
      if (viaOAuth) return loginWithError("oauth_failed", request);
      // Supabase stellt den Code erst nach geprüftem Link aus: Die Adresse ist
      // bestätigt, nur die Sitzung fehlt (meist ein anderer Browser).
      if (!isRecovery) failure.searchParams.set("status", "confirmed");
    } else if (tokenHash && type && OTP_TYPES.includes(type)) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error)
        return redirect(await destinationFor(supabase, next), request);
      logFailure(error);
    }
  } catch (error) {
    console.error(
      "[auth] Bestätigung fehlgeschlagen:",
      (error as Error).message,
    );
  }
  return withNoStore(NextResponse.redirect(failure));
}

/**
 * Neue Konten (z. B. von Google) haben das Onboarding noch nicht
 * abgeschlossen und richten zuerst ihr Profil ein. Fehlt die Profilzeile
 * oder die Tabelle, gilt das gewünschte Ziel.
 */
async function destinationFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  next: string,
): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return next;
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();
  const onboardingComplete =
    error || !data ? null : Boolean(data.onboarding_complete);
  return destinationAfterCallback(next, onboardingComplete);
}

function loginWithError(error: OAuthLoginError, request: NextRequest) {
  const target = new URL("/login", request.url);
  target.searchParams.set("error", error);
  return withNoStore(NextResponse.redirect(target));
}

function logFailure(error: AuthError) {
  console.warn(
    "[auth] Link nicht eingelöst:",
    error.code ?? error.name,
    error.message,
  );
}

function redirect(path: string, request: NextRequest) {
  return withNoStore(NextResponse.redirect(new URL(path, request.url)));
}

/** Antworten mit Auth-Cookies dürfen nicht zwischengespeichert werden. */
function withNoStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
