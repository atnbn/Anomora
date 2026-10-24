"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CircleCheckIcon,
  Loader2Icon,
  MailIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FormAlert,
  TextField,
  focusFirstInvalid,
} from "@/components/forms/fields";
import { AuthHeading } from "@/features/auth/components/auth-shared";
import {
  authErrorMessage,
  resendConfirmation,
} from "@/features/auth/supabase-auth";
import {
  demoActions,
  getAccountStatus,
  useDemoState,
} from "@/features/demo/store";
import { validateEmail } from "@/lib/validation/auth";

const RESEND_COOLDOWN = 60;

function StatusIcon({
  tone,
  children,
}: {
  tone: "brand" | "success" | "error";
  children: React.ReactNode;
}) {
  const toneClass = {
    brand: "bg-brand-soft text-brand",
    success: "bg-success/15 text-success",
    error: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <span
      className={`mb-6 flex size-14 items-center justify-center rounded-full ${toneClass}`}
    >
      {children}
    </span>
  );
}

/** Bestätigungsmail erneut anfordern – mit Sperrzeit gegen Spam und Rate-Limits. */
function ResendForm({ presetEmail }: { presetEmail: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState(presetEmail ?? "");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const nextError = validateEmail(email);
        setError(nextError);
        if (nextError) return focusFirstInvalid(formRef.current);
        setPending(true);
        try {
          await resendConfirmation(email.trim().toLowerCase());
          setCooldown(RESEND_COOLDOWN);
          toast.success("Neuer Bestätigungslink gesendet", {
            description: "Schau auch im Spam-Ordner nach.",
          });
        } catch (caught) {
          setError(authErrorMessage(caught as Error));
        } finally {
          setPending(false);
        }
      }}
    >
      {!presetEmail && (
        <TextField
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(undefined);
          }}
          error={error}
          disabled={pending}
        />
      )}
      {presetEmail && error && <FormAlert>{error}</FormAlert>}
      <Button
        type="submit"
        size="lg"
        variant={presetEmail ? "outline" : "default"}
        disabled={pending || cooldown > 0}
      >
        {pending && <Loader2Icon className="animate-spin" aria-hidden="true" />}
        {cooldown > 0
          ? `Erneut senden in ${cooldown} s`
          : "Bestätigungslink erneut senden"}
      </Button>
    </form>
  );
}

export function VerifyEmailView() {
  const router = useRouter();
  const linkStatus = useSearchParams().get("status");
  const { session, hydrated, authReady, pendingEmail, accounts } =
    useDemoState();

  if (!hydrated || !authReady) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Wird geladen">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // accounts als Abhängigkeit: der Status ändert sich mit dem gespiegelten Konto.
  void accounts;
  const status =
    session?.kind === "supabase" ? getAccountStatus(session.userId) : null;

  if (status?.emailVerified) {
    return (
      <>
        <StatusIcon tone="success">
          <CircleCheckIcon className="size-7" aria-hidden="true" />
        </StatusIcon>
        <div role="status">
          <AuthHeading
            title="E-Mail-Adresse bestätigt"
            description={
              status.onboardingComplete
                ? "Alles erledigt – viel Spaß auf ANIMORA."
                : "Super! Richte jetzt in zwei Minuten dein Profil ein."
            }
          />
        </div>
        <Link
          href={status.onboardingComplete ? "/dashboard" : "/onboarding"}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          {status.onboardingComplete ? "Zum Dashboard" : "Profil einrichten"}
        </Link>
      </>
    );
  }

  // Link geprüft, aber in einem anderen Browser geöffnet: bestätigt, nur nicht angemeldet.
  if (linkStatus === "confirmed") {
    return (
      <>
        <StatusIcon tone="success">
          <CircleCheckIcon className="size-7" aria-hidden="true" />
        </StatusIcon>
        <div role="status">
          <AuthHeading
            title="E-Mail-Adresse bestätigt"
            description="Melde dich jetzt mit deiner E-Mail-Adresse und deinem Passwort an. Danach richtest du dein Profil ein."
          />
        </div>
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Jetzt anmelden
        </Link>
      </>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <>
        <StatusIcon tone="error">
          <TriangleAlertIcon className="size-6" aria-hidden="true" />
        </StatusIcon>
        <div role="alert">
          <AuthHeading
            title="Dieser Link funktioniert nicht mehr"
            description="Bestätigungslinks sind nur begrenzt gültig und funktionieren nur einmal. Hast du ihn schon einmal geöffnet, ist deine Adresse vermutlich bestätigt – melde dich einfach an. Sonst fordere einen neuen Link an."
          />
        </div>
        <ResendForm presetEmail={pendingEmail} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Schon bestätigt?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand hover:underline"
          >
            Anmelden
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <StatusIcon tone="brand">
        <MailIcon className="size-6" aria-hidden="true" />
      </StatusIcon>
      <AuthHeading
        title="Bestätige deine E-Mail"
        description={
          pendingEmail ? (
            <>
              Wir haben einen Link an{" "}
              <span className="font-semibold break-all text-foreground">
                {pendingEmail}
              </span>{" "}
              geschickt. Öffne ihn in diesem Browser, um dein Konto zu
              aktivieren.
            </>
          ) : (
            "Öffne den Link aus unserer E-Mail, um dein Konto zu aktivieren. Keine E-Mail bekommen? Fordere hier einen neuen Link an."
          )
        }
      />

      <ResendForm presetEmail={pendingEmail} />

      <ul className="mt-6 grid gap-1.5 text-sm text-muted-foreground">
        <li>Keine E-Mail da? Schau auch im Spam-Ordner nach.</li>
        {pendingEmail && (
          <li>
            Falsche Adresse?{" "}
            <button
              type="button"
              onClick={() => {
                demoActions.setPendingEmail(null);
                router.push("/register");
              }}
              className="font-semibold text-brand hover:underline"
            >
              Neu registrieren
            </button>
          </li>
        )}
        <li>
          Schon bestätigt?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand hover:underline"
          >
            Anmelden
          </Link>
        </li>
      </ul>
    </>
  );
}
