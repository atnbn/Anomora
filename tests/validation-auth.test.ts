import { describe, expect, it } from "vitest";
import {
  BIO_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  passwordChecks,
  safeRedirect,
  validateBio,
  validateDisplayName,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateUsername,
} from "@/lib/validation/auth";

describe("validateEmail", () => {
  it("akzeptiert eine gültige Adresse, auch mit Leerzeichen außen", () => {
    expect(validateEmail("name@beispiel.de")).toBeUndefined();
    expect(validateEmail("  name@beispiel.de  ")).toBeUndefined();
  });

  it("meldet leere und unvollständige Adressen", () => {
    expect(validateEmail("")).toMatch(/E-Mail-Adresse ein/);
    expect(validateEmail("name@")).toMatch(/nicht wie eine E-Mail-Adresse/);
    expect(validateEmail("name@beispiel")).toMatch(/nicht wie eine/);
  });
});

describe("validateUsername", () => {
  it("akzeptiert Buchstaben, Zahlen und Unterstriche", () => {
    expect(validateUsername("Kenji_92")).toBeUndefined();
  });

  it("prüft die Länge", () => {
    expect(validateUsername("ab")).toMatch(/mindestens 3/);
    expect(validateUsername("a".repeat(USERNAME_MAX_LENGTH))).toBeUndefined();
    expect(validateUsername("a".repeat(USERNAME_MAX_LENGTH + 1))).toMatch(
      /höchstens 24/,
    );
  });

  it("lehnt Leerzeichen, Umlaute und Sonderzeichen ab", () => {
    expect(validateUsername("kenji san")).toMatch(/Erlaubt sind/);
    expect(validateUsername("Jürgen")).toMatch(/Erlaubt sind/);
    expect(validateUsername("kenji!")).toMatch(/Erlaubt sind/);
  });
});

describe("Passwortregeln", () => {
  it("listet erfüllte und fehlende Regeln", () => {
    expect(passwordChecks("abc").map((check) => check.met)).toEqual([
      false,
      true,
      false,
    ]);
    expect(passwordChecks("abcdefg1").every((check) => check.met)).toBe(true);
  });

  it("nennt fehlende Regeln im Fehlertext", () => {
    expect(validateNewPassword("")).toMatch(/wähle ein Passwort/);
    expect(validateNewPassword("abcdefgh")).toMatch(/mindestens eine zahl/);
    expect(validateNewPassword("abcdefg1")).toBeUndefined();
  });

  it("vergleicht die Wiederholung", () => {
    expect(validatePasswordConfirmation("abcdefg1", "")).toMatch(/wiederhole/);
    expect(validatePasswordConfirmation("abcdefg1", "abcdefg2")).toMatch(
      /stimmen nicht überein/,
    );
    expect(
      validatePasswordConfirmation("abcdefg1", "abcdefg1"),
    ).toBeUndefined();
  });
});

describe("Profilfelder", () => {
  it("verlangt einen Anzeigenamen mit höchstens 40 Zeichen", () => {
    expect(validateDisplayName("   ")).toMatch(/Anzeigenamen ein/);
    expect(validateDisplayName("a".repeat(40))).toBeUndefined();
    expect(validateDisplayName("a".repeat(41))).toMatch(/höchstens 40/);
  });

  it("begrenzt die Beschreibung", () => {
    expect(validateBio("a".repeat(BIO_MAX_LENGTH))).toBeUndefined();
    expect(validateBio("a".repeat(BIO_MAX_LENGTH + 1))).toBe(
      "Die Beschreibung ist 1 Zeichen zu lang.",
    );
  });
});

describe("safeRedirect", () => {
  it("lässt nur interne Pfade zu", () => {
    expect(safeRedirect("/anime")).toBe("/anime");
    expect(safeRedirect("/settings/profile?tab=1")).toBe(
      "/settings/profile?tab=1",
    );
  });

  it("verhindert Weiterleitungen auf fremde Seiten", () => {
    expect(safeRedirect(null)).toBe("/dashboard");
    expect(safeRedirect("https://example.com")).toBe("/dashboard");
    expect(safeRedirect("//example.com")).toBe("/dashboard");
    expect(safeRedirect("anime")).toBe("/dashboard");
    expect(safeRedirect("//example.com", "/login")).toBe("/login");
  });
});
