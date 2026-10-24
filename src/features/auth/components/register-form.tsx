"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CircleAlertIcon, Loader2Icon } from "lucide-react";
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
} from "@/features/auth/components/auth-shared";
import { authErrorMessage, signUp } from "@/features/auth/supabase-auth";
import { demoActions } from "@/features/demo/store";
import { useViewer } from "@/features/profiles/hooks";
import { isUsernameTaken } from "@/lib/data/users";
import {
  type FieldErrors,
  passwordChecks,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateUsername,
} from "@/lib/validation/auth";

type Field = "username" | "email" | "password" | "confirm" | "terms";

export function RegisterForm() {
  const router = useRouter();
  const { viewer, hydrated } = useViewer();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (hydrated && viewer && !pending) {
    return (
      <>
        <AuthHeading title="Du bist schon angemeldet" />
        <SignedInNotice viewer={viewer} />
      </>
    );
  }

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const username = values.username.trim();
    const nextErrors: FieldErrors<Field> = {
      username:
        validateUsername(username) ??
        (isUsernameTaken(username)
          ? "Dieser Nutzername ist schon vergeben."
          : undefined),
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
      confirm: validatePasswordConfirmation(values.password, values.confirm),
      terms: terms
        ? undefined
        : "Bitte stimme den Nutzungsbedingungen und der Datenschutzerklärung zu.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      focusFirstInvalid(formRef.current);
      return;
    }

    setPending(true);
    try {
      const { needsConfirmation } = await signUp({
        email: values.email,
        password: values.password,
        username,
      });
      // Das Passwort liegt nur bei Supabase; im Formular wird es sofort verworfen.
      setValues((current) => ({ ...current, password: "", confirm: "" }));
      if (needsConfirmation) {
        demoActions.setPendingEmail(values.email.trim().toLowerCase());
        router.push("/verify-email");
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      setPending(false);
      const code = (error as { code?: string }).code;
      const message = authErrorMessage(error as Error);
      if (code === "weak_password") setErrors({ password: message });
      else if (code === "user_already_exists" || code === "email_exists")
        setErrors({ email: message });
      else setFormError(message);
      focusFirstInvalid(formRef.current);
    }
  }

  return (
    <>
      <AuthHeading
        title="Konto erstellen"
        description="Kostenlos registrieren und deine Anime-Community finden."
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
          label="Nutzername"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={values.username}
          onChange={(event) => update("username", event.target.value)}
          hint="3–24 Zeichen: Buchstaben, Zahlen, Unterstrich. Öffentlich sichtbar."
          error={errors.username}
          disabled={pending}
        />
        <TextField
          label="E-Mail-Adresse"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          hint="Wir schicken dir einen Bestätigungslink."
          error={errors.email}
          disabled={pending}
        />
        <PasswordField
          label="Passwort"
          name="new-password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => update("password", event.target.value)}
          checks={passwordChecks(values.password)}
          error={errors.password}
          disabled={pending}
        />
        <PasswordField
          label="Passwort wiederholen"
          name="confirm-password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={(event) => update("confirm", event.target.value)}
          error={errors.confirm}
          disabled={pending}
        />
        <div className="grid gap-1.5">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => {
                setTerms(event.target.checked);
                setErrors((current) => ({ ...current, terms: undefined }));
              }}
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              disabled={pending}
              className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
            />
            <span className="text-muted-foreground">
              Ich akzeptiere die{" "}
              <Link
                href="/legal/nutzungsbedingungen"
                className="font-semibold text-foreground underline-offset-2 hover:underline"
              >
                Nutzungsbedingungen
              </Link>{" "}
              und habe die{" "}
              <Link
                href="/legal/datenschutz"
                className="font-semibold text-foreground underline-offset-2 hover:underline"
              >
                Datenschutzerklärung
              </Link>{" "}
              gelesen.
            </span>
          </label>
          {errors.terms && (
            <p
              id="terms-error"
              className="flex items-start gap-1.5 text-sm font-medium text-destructive"
            >
              <CircleAlertIcon
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {errors.terms}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          )}
          {pending ? "Konto wird erstellt …" : "Konto erstellen"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Schon registriert?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand hover:underline"
        >
          Anmelden
        </Link>
      </p>
      <div className="mt-8">
        <DemoNotice>
          Dein Konto wird bei Supabase angelegt; das Passwort speichert nur
          Supabase (verschlüsselt). Favoriten und Community-Inhalte liegen bis
          zur nächsten Ausbaustufe noch in diesem Browser.
        </DemoNotice>
      </div>
    </>
  );
}
