"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2Icon,
  MonitorSmartphoneIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DemoNotice,
  FormAlert,
  PasswordField,
  TextField,
  focusFirstInvalid,
} from "@/components/forms/fields";
import {
  authErrorMessage,
  signOutOtherSessions,
  updateEmail,
  updatePassword,
  verifyPassword,
} from "@/features/auth/supabase-auth";
import type { UserProfile } from "@/features/profiles/types";
import {
  findActiveBan,
  getAccountEmail,
  resetDemoState,
  useDemoState,
} from "@/features/demo/store";
import { useClock } from "@/features/demo/clock";
import {
  RequireViewer,
  SettingsSection,
} from "@/features/settings/settings-shell";
import { formatDateTime } from "@/lib/format";
import {
  type FieldErrors,
  passwordChecks,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from "@/lib/validation/auth";

function EmailForm({
  isSupabase,
  email,
}: {
  isSupabase: boolean;
  email: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(email);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  if (!isSupabase) {
    return (
      <div className="grid gap-3">
        <TextField label="E-Mail-Adresse" value={email} readOnly disabled />
        <DemoNotice>
          Die Adresse der vorgegebenen Demo-Konten ist fest. Mit einem eigenen
          Konto kannst du sie ändern.
        </DemoNotice>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const nextError =
          validateEmail(value) ??
          (value.trim().toLowerCase() === email
            ? "Das ist bereits deine aktuelle Adresse."
            : undefined);
        setError(nextError);
        if (nextError) return focusFirstInvalid(formRef.current);
        setPending(true);
        try {
          await updateEmail(value);
          toast.success("Bitte bestätige die Änderung", {
            description:
              "Wir haben dir Bestätigungslinks geschickt. Die neue Adresse gilt erst danach.",
          });
        } catch (caught) {
          setError(authErrorMessage(caught as Error));
          focusFirstInvalid(formRef.current);
        } finally {
          setPending(false);
        }
      }}
    >
      <TextField
        label="E-Mail-Adresse"
        type="email"
        autoComplete="email"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setError(undefined);
        }}
        error={error}
        disabled={pending}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          )}
          E-Mail ändern
        </Button>
      </div>
    </form>
  );
}

type PasswordFieldName = "current" | "next" | "confirm";

function PasswordForm({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors<PasswordFieldName>>({});
  const [pending, setPending] = useState(false);

  function update(field: PasswordFieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <form
      ref={formRef}
      noValidate
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const nextErrors: FieldErrors<PasswordFieldName> = {
          current: values.current
            ? undefined
            : "Bitte gib dein aktuelles Passwort ein.",
          next:
            validateNewPassword(values.next) ??
            (values.next && values.next === values.current
              ? "Das neue Passwort muss sich vom aktuellen unterscheiden."
              : undefined),
          confirm: validatePasswordConfirmation(values.next, values.confirm),
        };
        setErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean))
          return focusFirstInvalid(formRef.current);
        setPending(true);
        try {
          try {
            await verifyPassword(email, values.current);
          } catch {
            setErrors({ current: "Das aktuelle Passwort ist nicht korrekt." });
            focusFirstInvalid(formRef.current);
            return;
          }
          await updatePassword(values.next);
          setValues({ current: "", next: "", confirm: "" });
          toast.success("Passwort geändert");
        } catch (caught) {
          setErrors({ next: authErrorMessage(caught as Error) });
          focusFirstInvalid(formRef.current);
        } finally {
          setPending(false);
        }
      }}
    >
      <PasswordField
        label="Aktuelles Passwort"
        autoComplete="current-password"
        value={values.current}
        onChange={(event) => update("current", event.target.value)}
        error={errors.current}
        disabled={pending}
      />
      <PasswordField
        label="Neues Passwort"
        autoComplete="new-password"
        value={values.next}
        onChange={(event) => update("next", event.target.value)}
        checks={passwordChecks(values.next)}
        error={errors.next}
        disabled={pending}
      />
      <PasswordField
        label="Neues Passwort wiederholen"
        autoComplete="new-password"
        value={values.confirm}
        onChange={(event) => update("confirm", event.target.value)}
        error={errors.confirm}
        disabled={pending}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          )}
          Passwort ändern
        </Button>
      </div>
    </form>
  );
}

function DeleteAccount({ isSupabase }: { isSupabase: boolean }) {
  const router = useRouter();

  if (isSupabase) {
    return (
      <p className="text-sm text-muted-foreground">
        Das Löschen eines Kontos braucht eine Server-Funktion mit
        Administratorrechten. Sie kommt mit der Datenbank-Anbindung im nächsten
        Ausbauschritt; bis dahin lässt sich das Konto nur im Supabase-Dashboard
        entfernen.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Vorgegebene Demo-Konten lassen sich nicht löschen. Du kannst aber alle
        Demo-Daten in diesem Browser zurücksetzen.
      </p>
      <div>
        <Button
          variant="outline"
          onClick={() => {
            resetDemoState();
            toast.success("Demo-Daten zurückgesetzt");
            router.push("/");
          }}
        >
          Demo-Daten zurücksetzen
        </Button>
      </div>
    </div>
  );
}

function AccountContent({ viewer }: { viewer: UserProfile }) {
  const { session, bans } = useDemoState();
  const clock = useClock();
  const isSupabase = session?.kind === "supabase";
  const [signingOut, setSigningOut] = useState(false);
  const email = getAccountEmail(viewer.id) ?? "";
  const ban = findActiveBan(bans, viewer.id, clock.now, clock.shift);

  return (
    <div className="grid gap-6">
      {ban && (
        <FormAlert>
          <span className="font-semibold">Dein Konto ist gesperrt</span>
          {ban.until
            ? ` bis ${formatDateTime(Date.parse(ban.until) + (ban.seeded ? clock.shift : 0))} Uhr`
            : " (dauerhaft)"}
          . Du kannst bis dahin nichts veröffentlichen. Grund: {ban.reason}
        </FormAlert>
      )}
      <SettingsSection
        title="E-Mail-Adresse"
        description="An diese Adresse schicken wir Bestätigungen und Links zum Zurücksetzen."
      >
        <EmailForm key={email} isSupabase={isSupabase} email={email} />
      </SettingsSection>
      <SettingsSection
        title="Passwort ändern"
        description="Verwende ein Passwort, das du nirgendwo anders nutzt."
      >
        {isSupabase ? (
          <PasswordForm email={email} />
        ) : (
          <DemoNotice>
            Demo-Konten haben kein Passwort. Mit einem eigenen Konto kannst du
            es hier ändern.
          </DemoNotice>
        )}
      </SettingsSection>
      <SettingsSection
        title="Angemeldete Geräte"
        description="Hier siehst du, wo dein Konto angemeldet ist."
      >
        <ul className="divide-y rounded-md border">
          <li className="flex items-center gap-3 p-3">
            <MonitorSmartphoneIcon
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Dieser Browser</p>
              <p className="text-xs text-muted-foreground">Aktuelle Sitzung</p>
            </div>
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
              Aktiv
            </span>
          </li>
        </ul>
        {isSupabase ? (
          <Button
            variant="outline"
            className="mt-4"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                await signOutOtherSessions();
                toast.success("Auf allen anderen Geräten abgemeldet");
              } catch (caught) {
                toast.error(authErrorMessage(caught as Error));
              } finally {
                setSigningOut(false);
              }
            }}
          >
            {signingOut && (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            )}
            Auf allen anderen Geräten abmelden
          </Button>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Demo-Konten haben keine Sitzungen auf anderen Geräten.
          </p>
        )}
      </SettingsSection>
      <SettingsSection title="Konto löschen" tone="danger">
        <div className="flex items-start gap-3">
          <ShieldAlertIcon
            className="mt-0.5 size-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <DeleteAccount isSupabase={isSupabase} />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

export function AccountSettings() {
  return (
    <RequireViewer>
      {(viewer) => <AccountContent viewer={viewer} />}
    </RequireViewer>
  );
}
