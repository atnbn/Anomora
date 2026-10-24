"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CircleCheckIcon,
  LinkIcon,
  Loader2Icon,
  MailIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DemoNotice } from "@/components/forms/fields";
import {
  AuthHeading,
  simulateRequest,
} from "@/features/auth/components/auth-shared";
import {
  demoActions,
  getAccountEmail,
  getAccountStatus,
  useDemoState,
} from "@/features/demo/store";

const RESEND_COOLDOWN = 30;

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

export function VerifyEmailView() {
  const router = useRouter();
  const invalidLink = useSearchParams().get("status") === "invalid";
  const { session, hydrated, accounts } = useDemoState();
  const [cooldown, setCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!hydrated) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Wird geladen">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <StatusIcon tone="brand">
          <MailIcon className="size-6" aria-hidden="true" />
        </StatusIcon>
        <AuthHeading
          title="E-Mail bestätigen"
          description="Melde dich an, um den Status deiner Bestätigung zu sehen oder einen neuen Link anzufordern."
        />
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Zur Anmeldung
        </Link>
      </>
    );
  }

  // accounts als Abhängigkeit sorgt für Neuberechnung nach der Bestätigung.
  void accounts;
  const status = getAccountStatus(session.userId);
  const email = getAccountEmail(session.userId);

  function resend() {
    setCooldown(RESEND_COOLDOWN);
    toast.success("Neuer Bestätigungslink gesendet", {
      description: "Demo: Es wird keine echte E-Mail verschickt.",
    });
    if (invalidLink) router.replace("/verify-email");
  }

  async function openDemoLink() {
    setVerifying(true);
    await simulateRequest(500);
    demoActions.verifyEmail();
    setVerifying(false);
  }

  if (status.emailVerified) {
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

  if (invalidLink) {
    return (
      <>
        <StatusIcon tone="error">
          <TriangleAlertIcon className="size-6" aria-hidden="true" />
        </StatusIcon>
        <div role="alert">
          <AuthHeading
            title="Dieser Link ist abgelaufen"
            description="Bestätigungslinks sind aus Sicherheitsgründen nur 24 Stunden gültig. Fordere einfach einen neuen an."
          />
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={resend}
          disabled={cooldown > 0}
        >
          {cooldown > 0
            ? `Neuer Link in ${cooldown} s möglich`
            : "Neuen Link senden"}
        </Button>
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
          <>
            Wir haben einen Link an{" "}
            <span className="font-semibold break-all text-foreground">
              {email}
            </span>{" "}
            geschickt. Öffne ihn, um dein Konto zu aktivieren.
          </>
        }
      />

      <div className="grid gap-3">
        <Button size="lg" onClick={openDemoLink} disabled={verifying}>
          {verifying ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <LinkIcon aria-hidden="true" />
          )}
          {verifying ? "Wird bestätigt …" : "Demo: Bestätigungslink öffnen"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={resend}
          disabled={cooldown > 0}
        >
          {cooldown > 0
            ? `Erneut senden in ${cooldown} s`
            : "E-Mail erneut senden"}
        </Button>
      </div>

      <ul className="mt-6 grid gap-1.5 text-sm text-muted-foreground">
        <li>Keine E-Mail da? Schau auch im Spam-Ordner nach.</li>
        <li>
          Falsche Adresse?{" "}
          <button
            type="button"
            onClick={() => {
              demoActions.signOut();
              router.push("/register");
            }}
            className="font-semibold text-brand hover:underline"
          >
            Neu registrieren
          </button>
        </li>
        <li>
          <Link
            href="/verify-email?status=invalid"
            className="font-semibold text-brand hover:underline"
          >
            Demo: abgelaufenen Link simulieren
          </Link>
        </li>
      </ul>

      <div className="mt-8">
        <DemoNotice>
          Demo-Modus: Es wird keine E-Mail verschickt. Der Button oben ersetzt
          den Link aus der Bestätigungs-E-Mail.
        </DemoNotice>
      </div>
    </>
  );
}
