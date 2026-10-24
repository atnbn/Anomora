"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  ChevronLeftIcon,
  CircleCheckIcon,
  KeyRoundIcon,
  LinkIcon,
  Loader2Icon,
  MailCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DemoNotice,
  PasswordField,
  TextField,
  focusFirstInvalid,
} from "@/components/forms/fields";
import {
  AuthHeading,
  simulateRequest,
} from "@/features/auth/components/auth-shared";
import { demoActions, useDemoState } from "@/features/demo/store";
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
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextError = validateEmail(email);
    setError(nextError);
    if (nextError) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setPending(true);
    await simulateRequest();
    demoActions.requestPasswordReset(email);
    setPending(false);
    setSentTo(email.trim());
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
                Er ist eine Stunde gültig.
              </>
            }
          />
        </div>
        <div className="grid gap-3">
          <Link
            href="/reset-password?token=demo"
            className={buttonVariants({ size: "lg" })}
          >
            <LinkIcon aria-hidden="true" />
            Demo: Link aus der E-Mail öffnen
          </Link>
          <Button size="lg" variant="outline" onClick={() => setSentTo(null)}>
            Andere E-Mail-Adresse verwenden
          </Button>
        </div>
        <div className="mt-8">
          <DemoNotice>
            Demo-Modus: Es wird keine E-Mail verschickt. Aus Sicherheitsgründen
            verrät die Meldung nicht, ob ein Konto existiert – so wie später in
            Produktion.
          </DemoNotice>
        </div>
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

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const { passwordResetEmail, hydrated } = useDemoState();
  const formRef = useRef<HTMLFormElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors<ResetField>>({});
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
            description="Du kannst dich jetzt mit deinem neuen Passwort anmelden. Andere Sitzungen wurden abgemeldet."
          />
        </div>
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Zur Anmeldung
        </Link>
      </>
    );
  }

  // Ohne gültigen (Demo-)Link: abgelaufen oder bereits verwendet.
  if (hydrated && (!token || !passwordResetEmail)) {
    return (
      <>
        <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <TriangleAlertIcon className="size-6" aria-hidden="true" />
        </span>
        <div role="alert">
          <AuthHeading
            title="Link ungültig oder abgelaufen"
            description="Links zum Zurücksetzen sind eine Stunde gültig und funktionieren nur einmal. Fordere einen neuen an."
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors<ResetField> = {
      password: validateNewPassword(password),
      confirm: validatePasswordConfirmation(password, confirm),
    };
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirm) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setPending(true);
    await simulateRequest();
    demoActions.completePasswordReset();
    setPassword("");
    setConfirm("");
    setPending(false);
    setDone(true);
  }

  return (
    <>
      <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        <KeyRoundIcon className="size-6" aria-hidden="true" />
      </span>
      <AuthHeading
        title="Neues Passwort festlegen"
        description={
          passwordResetEmail ? (
            <>
              Für{" "}
              <span className="font-semibold break-all text-foreground">
                {passwordResetEmail}
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
      <div className="mt-8">
        <DemoNotice>
          Demo-Modus: Das neue Passwort wird geprüft, aber nirgends gespeichert.
        </DemoNotice>
      </div>
    </>
  );
}
