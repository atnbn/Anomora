import type { AuthError, EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/validation/auth";

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

  try {
    const supabase = await createClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return redirect(next, request);
      logFailure(error);
      // Supabase stellt den Code erst nach geprüftem Link aus: Die Adresse ist
      // bestätigt, nur die Sitzung fehlt (meist ein anderer Browser).
      if (!isRecovery) failure.searchParams.set("status", "confirmed");
    } else if (tokenHash && type && OTP_TYPES.includes(type)) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) return redirect(next, request);
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
