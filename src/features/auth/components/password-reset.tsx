"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ChevronLeftIcon,
  CircleCheckIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FormAlert,
  PasswordField,
  TextField,
  focusFirstInvalid,
} from "@/components/forms/fields";
import { AuthHeading } from "@/features/auth/components/auth-shared";
import {
  authErrorMessage,
  requestPasswordReset,
  updatePassword,
} from "@/features/auth/supabase-auth";
import { getAccountEmail, useDemoState } from "@/features/demo/store";
import {
  type FieldErrors,
  passwordChecks,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from "@/lib/validation/auth";

function BackToLogin() {
  return (
    <Link
      href="/login"
      className="-ml-2 mb-6 inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ChevronLeftIcon className="size-4" aria-hidden="true" />
      Zur Anmeldung
    </Link>
  );
}

export function ForgotPasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = validateEmail(email);
    setError(nextError);
    setFormError(null);
    if (nextError) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setPending(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (caught) {
      setFormError(authErrorMessage(caught as Error));
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <>
        <BackToLogin />
        <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <MailCheckIcon className="size-6" aria-hidden="true" />
        </span>
        <div role="status">
          <AuthHeading
            title="Schau in dein Postfach"
            description={
              <>
                Falls ein Konto mit{" "}
                <span className="font-semibold break-all text-foreground">
                  {sentTo}
                </span>{" "}
                existiert, haben wir dir einen Link zum Zurücksetzen geschickt.
                Öffne ihn in diesem Browser.
              </>
            }
          />
        </div>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => setSentTo(null)}
        >
          Andere E-Mail-Adresse verwenden
        </Button>
      </>
    );
  }

  return (
    <>
      <BackToLogin />
      <AuthHeading
        title="Passwort vergessen?"
        description="Gib die E-Mail-Adresse deines Kontos ein. Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst."
      />
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className="grid gap-5"
        aria-busy={pending}
      >
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
            setError(undefined);
          }}
          error={error}
          disabled={pending}
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending && (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          )}
          {pending ? "Wird gesendet …" : "Link senden"}
        </Button>
      </form>
    </>
  );
}

type ResetField = "password" | "confirm";

/**
 * Neues Passwort setzen. Der Link aus der E-Mail führt über /auth/confirm
 * hierher und meldet dabei an – ohne diese Sitzung ist der Link ungültig.
 */
export function ResetPasswordForm() {
  const { session, hydrated, authReady } = useDemoState();
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors<ResetField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <>
        <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CircleCheckIcon className="size-7" aria-hidden="true" />
        </span>
        <div role="status">
          <AuthHeading
            title="Passwort geändert"
            description="Dein neues Passwort gilt ab sofort. Du bist weiterhin angemeldet."
          />
        </div>
        <Link
          href="/dashboard"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Zum Dashboard
        </Link>
      </>
    );
  }

  if (!hydrated || !authReady) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Wird geladen">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    );
  }

  if (session?.kind !== "supabase") {
    return (
      <>
        <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <TriangleAlertIcon className="size-6" aria-hidden="true" />
        </span>
        <div role="alert">
          <AuthHeading
            title="Link ungültig oder abgelaufen"
            description="Links zum Zurücksetzen sind nur begrenzt gültig und funktionieren nur einmal. Fordere einen neuen an."
          />
        </div>
        <Link
          href="/forgot-password"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Neuen Link anfordern
        </Link>
      </>
    );
  }

  const email = getAccountEmail(session.userId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors<ResetField> = {
      password: validateNewPassword(password),
      confirm: validatePasswordConfirmation(password, confirm),
    };
    setErrors(nextErrors);
    setFormError(null);
    if (nextErrors.password || nextErrors.confirm) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setPending(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      setDone(true);
    } catch (caught) {
      const message = authErrorMessage(caught as Error);
      if (
        (caught as { code?: string }).code === "same_password" ||
        (caught as { code?: string }).code === "weak_password"
      )
        setErrors({ password: message });
      else setFormError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <KeyRoundIcon className="size-6" aria-hidden="true" />
      </span>
      <AuthHeading
        title="Neues Passwort festlegen"
        description={
          email ? (
            <>
              Für{" "}
              <span className="font-semibold break-all text-foreground">
                {email}
              </span>
            </>
          ) : undefined
        }
      />
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className="grid gap-5"
        aria-busy={pending}
      >
        {formError && <FormAlert>{formError}</FormAlert>}
        <PasswordField
          label="Neues Passwort"
          name="new-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
          checks={passwordChecks(password)}
          error={errors.password}
          disabled={pending}
        />
        <PasswordField
          label="Neues Passwort wiederholen"
          name="confirm-password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => {
            setConfirm(event.target.value);
            setErrors((current) => ({ ...current, confirm: undefined }));
          }}
          error={errors.confirm}
          disabled={pending}
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending && (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          )}
          {pending ? "Wird gespeichert …" : "Passwort speichern"}
        </Button>
      </form>
    </>
  );
}
