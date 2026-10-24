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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DemoNotice,
  FormAlert,
  PasswordField,
  TextField,
  focusFirstInvalid,
} from "@/components/forms/fields";
import { simulateRequest } from "@/features/auth/components/auth-shared";
import type { UserProfile } from "@/features/profiles/types";
import {
  demoActions,
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

function EmailForm({ isLocal, email }: { isLocal: boolean; email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState(email);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  if (!isLocal) {
    return (
      <div className="grid gap-3">
        <TextField label="E-Mail-Adresse" value={email} readOnly disabled />
        <DemoNotice>
          Die Adresse der vorgegebenen Demo-Konten ist fest. In einem selbst
          registrierten Konto kannst du sie ändern.
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
        await simulateRequest();
        const result = demoActions.updateEmail(value);
        setPending(false);
        if (!result.ok) {
          setError(result.message);
          return focusFirstInvalid(formRef.current);
        }
        toast.success("E-Mail-Adresse geändert", {
          description:
            "Demo: In Produktion bestätigst du die neue Adresse per Link.",
        });
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

function PasswordForm() {
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
        await simulateRequest();
        setPending(false);
        setValues({ current: "", next: "", confirm: "" });
        toast.success("Passwort geändert", {
          description:
            "Demo: Das Passwort wurde geprüft, aber nicht gespeichert.",
        });
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

function DeleteAccount({
  viewer,
  isLocal,
}: {
  viewer: UserProfile;
  isLocal: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | undefined>();

  if (!isLocal) {
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

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Dein Profil, deine Favoriten, Beiträge und Kommentare werden dauerhaft
        gelöscht. Das kann nicht rückgängig gemacht werden.
      </p>
      <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
        Konto löschen
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setConfirmation("");
            setError(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form
            noValidate
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (confirmation.trim() !== viewer.username) {
                setError(`Gib zur Bestätigung genau „${viewer.username}“ ein.`);
                return;
              }
              demoActions.deleteAccount();
              toast.success("Dein Konto wurde gelöscht");
              router.push("/");
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Konto endgültig löschen?
              </DialogTitle>
              <DialogDescription>
                Alle deine Daten werden entfernt. Gib zur Bestätigung deinen
                Nutzernamen ein.
              </DialogDescription>
            </DialogHeader>
            <TextField
              label={`Nutzername (${viewer.username})`}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setError(undefined);
              }}
              error={error}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" variant="danger">
                Endgültig löschen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AccountContent({ viewer }: { viewer: UserProfile }) {
  const { accounts, bans } = useDemoState();
  const clock = useClock();
  const isLocal = accounts.some((account) => account.id === viewer.id);
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
        <EmailForm key={email} isLocal={isLocal} email={email} />
      </SettingsSection>
      <SettingsSection
        title="Passwort ändern"
        description="Verwende ein Passwort, das du nirgendwo anders nutzt."
      >
        <PasswordForm />
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
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            toast.success("Auf allen anderen Geräten abgemeldet", {
              description: "Demo: Es gibt keine weiteren Sitzungen.",
            })
          }
        >
          Auf allen anderen Geräten abmelden
        </Button>
      </SettingsSection>
      <SettingsSection title="Konto löschen" tone="danger">
        <div className="flex items-start gap-3">
          <ShieldAlertIcon
            className="mt-0.5 size-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <DeleteAccount viewer={viewer} isLocal={isLocal} />
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
