/**
 * Clientseitige Validierung für Auth- und Profilformulare.
 * Dieselben Regeln gelten später serverseitig (Supabase Auth / Server Actions);
 * die Prüfung im Browser ersetzt keine serverseitige Validierung.
 */

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const BIO_MAX_LENGTH = 160;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Bitte gib deine E-Mail-Adresse ein.";
  if (!EMAIL_PATTERN.test(email))
    return "Das sieht nicht wie eine E-Mail-Adresse aus, z. B. name@beispiel.de.";
  return undefined;
}

export type PasswordCheck = { label: string; met: boolean };

export function passwordChecks(value: string): PasswordCheck[] {
  return [
    {
      label: `Mindestens ${PASSWORD_MIN_LENGTH} Zeichen`,
      met: value.length >= PASSWORD_MIN_LENGTH,
    },
    { label: "Mindestens ein Buchstabe", met: /[A-Za-zÄÖÜäöüß]/.test(value) },
    { label: "Mindestens eine Zahl", met: /\d/.test(value) },
  ];
}

export function validateNewPassword(value: string): string | undefined {
  if (!value) return "Bitte wähle ein Passwort.";
  const missing = passwordChecks(value).filter((check) => !check.met);
  if (missing.length > 0)
    return `Dein Passwort braucht noch: ${missing.map((check) => check.label.toLowerCase()).join(", ")}.`;
  return undefined;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return "Bitte wiederhole dein Passwort.";
  if (password !== confirmation) return "Die Passwörter stimmen nicht überein.";
  return undefined;
}

export function validateUsername(value: string): string | undefined {
  const username = value.trim();
  if (!username) return "Bitte wähle einen Nutzernamen.";
  if (username.length < USERNAME_MIN_LENGTH)
    return `Dein Nutzername braucht mindestens ${USERNAME_MIN_LENGTH} Zeichen.`;
  if (username.length > USERNAME_MAX_LENGTH)
    return `Dein Nutzername darf höchstens ${USERNAME_MAX_LENGTH} Zeichen haben.`;
  if (!USERNAME_PATTERN.test(username))
    return "Erlaubt sind Buchstaben ohne Umlaute, Zahlen und Unterstriche.";
  return undefined;
}

export function validateDisplayName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return "Bitte gib einen Anzeigenamen ein.";
  if (name.length > 40)
    return "Der Anzeigename darf höchstens 40 Zeichen haben.";
  return undefined;
}

export function validateBio(value: string): string | undefined {
  if (value.length > BIO_MAX_LENGTH)
    return `Die Beschreibung ist ${value.length - BIO_MAX_LENGTH} Zeichen zu lang.`;
  return undefined;
}

/** Nur interne Pfade als Weiterleitungsziel zulassen (kein Open Redirect). */
export function safeRedirect(target: string | null, fallback = "/dashboard") {
  if (!target || !target.startsWith("/") || target.startsWith("//"))
    return fallback;
  return target;
}
