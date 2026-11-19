"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/forms/fields";
import { oauthStartErrorMessage } from "@/features/auth/oauth";
import {
  isAuthConfigured,
  signInWithGoogle,
} from "@/features/auth/supabase-auth";
import { cn } from "@/lib/utils";

/** Das mehrfarbige „G“ nach den Gestaltungsregeln von Google für Anmeldeknöpfe. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={cn("size-5", className)}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * „Mit Google fortfahren“ für Anmeldung und Registrierung. Der Browser
 * verlässt danach die Seite; Fehler beim Start zeigt der Knopf selbst an.
 */
export function GoogleButton({
  next,
  disabled,
  showConsent = false,
}: {
  next: string | null;
  disabled?: boolean;
  /** Auf der Registrierungsseite: Hinweis auf Nutzungsbedingungen und Datenschutz. */
  showConsent?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isAuthConfigured();

  async function start() {
    setError(null);
    setPending(true);
    try {
      await signInWithGoogle(next);
      // Erfolgreich: Der Browser wechselt gleich zu Google, `pending` bleibt.
    } catch (caught) {
      setPending(false);
      setError(oauthStartErrorMessage(caught as Error));
    }
  }

  return (
    <div className="grid gap-3">
      {error && <FormAlert>{error}</FormAlert>}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={start}
        disabled={disabled || pending || !configured}
      >
        {pending ? (
          <Loader2Icon className="animate-spin" aria-hidden="true" />
        ) : (
          <GoogleMark />
        )}
        {pending ? "Weiter zu Google …" : "Mit Google fortfahren"}
      </Button>
      {showConsent && (
        <p className="text-center text-xs text-muted-foreground">
          Mit der Anmeldung über Google stimmst du den{" "}
          <Link
            href="/legal/nutzungsbedingungen"
            className="font-semibold text-foreground underline-offset-2 hover:underline"
          >
            Nutzungsbedingungen
          </Link>{" "}
          zu und bestätigst, die{" "}
          <Link
            href="/legal/datenschutz"
            className="font-semibold text-foreground underline-offset-2 hover:underline"
          >
            Datenschutzerklärung
          </Link>{" "}
          gelesen zu haben.
        </p>
      )}
    </div>
  );
}
