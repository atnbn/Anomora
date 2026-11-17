import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type ProfileRow,
  USERNAME_TAKEN_MESSAGE,
  UsernameTakenError,
  isMissingSchema,
  isUniqueViolation,
  rowToAccountFields,
  toProfileUpdate,
} from "@/features/profiles/profile-row";
import {
  BIO_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/lib/validation/auth";

const row: ProfileRow = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  username: "Kenji_92",
  display_name: "Kenji",
  bio: null,
  avatar_hue: 222,
  onboarding_complete: true,
  role: "member",
  created_at: "2026-11-17T10:00:00Z",
  updated_at: "2026-11-17T10:00:00Z",
};

describe("toProfileUpdate", () => {
  it("wandelt Formulareingaben in Tabellenspalten um und trimmt", () => {
    expect(
      toProfileUpdate({
        displayName: "  Kenji  ",
        username: " Kenji_92 ",
        bio: "  Mag Shōnen.  ",
        avatarHue: 222,
      }),
    ).toEqual({
      username: "Kenji_92",
      display_name: "Kenji",
      bio: "Mag Shōnen.",
      avatar_hue: 222,
    });
  });

  it("speichert eine leere Beschreibung als null", () => {
    expect(
      toProfileUpdate({
        displayName: "K",
        username: "kenji",
        bio: "   ",
        avatarHue: 0,
      }).bio,
    ).toBeNull();
    expect(
      toProfileUpdate({ displayName: "K", username: "kenji", avatarHue: 0 })
        .bio,
    ).toBeNull();
  });

  it("enthält keine Spalten, die Nutzer nicht ändern dürfen", () => {
    const update = toProfileUpdate({
      displayName: "K",
      username: "kenji",
      avatarHue: 0,
    });
    expect(Object.keys(update)).not.toContain("role");
    expect(Object.keys(update)).not.toContain("id");
  });
});

describe("rowToAccountFields", () => {
  it("übernimmt die Profilzeile ins Konto", () => {
    expect(rowToAccountFields(row)).toEqual({
      username: "Kenji_92",
      displayName: "Kenji",
      bio: undefined,
      avatarHue: 222,
      onboardingComplete: true,
    });
    expect(rowToAccountFields({ ...row, bio: "Hallo" }).bio).toBe("Hallo");
  });
});

describe("Fehler aus der Datenbank", () => {
  it("erkennt einen doppelten Nutzernamen", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: "23514" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });

  it("erkennt eine noch nicht angewendete Migration", () => {
    for (const code of ["42P01", "42883", "PGRST202", "PGRST205"])
      expect(isMissingSchema({ code })).toBe(true);
    expect(isMissingSchema({ code: "42501" })).toBe(false);
    expect(isMissingSchema(undefined)).toBe(false);
  });

  it("liefert eine verständliche Meldung für vergebene Namen", () => {
    const error = new UsernameTakenError();
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(USERNAME_TAKEN_MESSAGE);
  });
});

describe("Migration und Formularregeln stimmen überein", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261117120000_create_profiles.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("nutzt dieselben Grenzen für den Nutzernamen", () => {
    expect(sql).toContain(
      `'^[A-Za-z0-9_]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$'`,
    );
  });

  it("nutzt dieselbe Höchstlänge für die Beschreibung", () => {
    expect(sql).toContain(`char_length(bio) <= ${BIO_MAX_LENGTH}`);
  });

  it("schaltet RLS ein und lässt Nutzer nur ihr eigenes Profil ändern", () => {
    expect(sql).toContain(
      "alter table public.profiles enable row level security;",
    );
    expect(sql).toContain("using ((select auth.uid()) = id)");
    expect(sql).toMatch(
      /grant update \(username, display_name, bio, avatar_hue, onboarding_complete\)/,
    );
    expect(sql).not.toMatch(/grant (insert|delete|all)[^;]*profiles/);
  });
});
