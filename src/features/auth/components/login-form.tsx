"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DemoNotice,
  FormAlert,
  PasswordField,
  TextField,
  focusFirstInvalid,
} from "@/components/forms/fields";
import {
  AuthHeading,
  SignedInNotice,
  routeAfterSignIn,
} from "@/features/auth/components/auth-shared";
import {
  authErrorMessage,
  isAuthConfigured,
  signIn,
} from "@/features/auth/supabase-auth";
import { demoActions, getAccountStatus } from "@/features/demo/store";
import { useViewer } from "@/features/profiles/hooks";
import { DEMO_VIEWER_ID } from "@/data/demo/users";
import { type FieldErrors, validateEmail } from "@/lib/validation/auth";

type Field = "email" | "password";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { viewer, hydrated } = useViewer();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (hydrated && viewer && !pending) {
    return (
      <>
        <AuthHeading title="Du bist schon angemeldet" />
        <SignedInNotice viewer={viewer} />
      </>
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors<Field> = {
      email: validateEmail(email),
      password: password ? undefined : "Bitte gib dein Passwort ein.",
    };
    setErrors(nextErrors);
    setFormError(null);
    if (nextErrors.email || nextErrors.password) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setPending(true);
    try {
      const account = await signIn(email, password);
      setPassword("");
      toast.success("Willkommen zurück!");
      router.push(
        routeAfterSignIn(
          {
            userId: account.id,
            emailVerified: account.emailVerified,
            onboardingComplete: account.onboardingComplete,
          },
          next,
        ),
      );
    } catch (error) {
      setPending(false);
      // Supabase verrät bewusst nicht, ob es das Konto gibt.
      setFormError(authErrorMessage(error as Error));
    }
  }

  function continueWithDemo() {
    setPending(true);
    demoActions.signIn(DEMO_VIEWER_ID);
    toast.success("Mit Demo-Konto angemeldet");
    router.push(routeAfterSignIn(getAccountStatus(DEMO_VIEWER_ID), next));
  }

  return (
    <>
      <AuthHeading
        title="Willkommen zurück"
        description="Melde dich an, um deine Serien und Diskussionen zu sehen."
      />
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className="grid gap-5"
        aria-busy={pending}
      >
        {!isAuthConfigured() && (
          <FormAlert>
            Die Anmeldung ist nicht konfiguriert (Supabase-Umgebungsvariablen
            fehlen). Du kannst ANIMORA mit dem Demo-Konto ansehen.
          </FormAlert>
        )}
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          label="E-Mail-Adresse"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          error={errors.email}
          disabled={pending}
        />
        <PasswordField
          label="Passwort"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
          error={errors.password}
          disabled={pending}
          labelAside={
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-brand hover:underline"
            >
              Passwort vergessen?
            </Link>
          }
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending && (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          )}
          {pending ? "Wird angemeldet …" : "Anmelden"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        oder
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={continueWithDemo}
        disabled={pending}
      >
        Mit Demo-Konto ansehen
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand hover:underline"
        >
          Jetzt registrieren
        </Link>
      </p>

      <div className="mt-8">
        <DemoNotice>
          Die Anmeldung läuft über Supabase. „Mit Demo-Konto ansehen“ öffnet
          dagegen ein vorgegebenes Beispielkonto ohne Anmeldung, dessen Daten
          nur in diesem Browser liegen.
        </DemoNotice>
      </div>
    </>
  );
}
