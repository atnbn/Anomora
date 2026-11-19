import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  destinationAfterCallback,
  hasPasswordLogin,
  oauthErrorFromParams,
  oauthLoginErrorMessage,
  oauthStartErrorMessage,
  providersFromAppMetadata,
} from "@/features/auth/oauth";

describe("oauthErrorFromParams", () => {
  it("erkennt einen Abbruch bei Google", () => {
    expect(
      oauthErrorFromParams(
        new URLSearchParams("error=access_denied&error_description=denied"),
      ),
    ).toBe("oauth_cancelled");
  });

  it("meldet andere Fehler als fehlgeschlagen", () => {
    expect(
      oauthErrorFromParams(new URLSearchParams("error=server_error")),
    ).toBe("oauth_failed");
  });

  it("gibt ohne Fehler null zurück", () => {
    expect(oauthErrorFromParams(new URLSearchParams("code=abc"))).toBeNull();
  });
});

describe("oauthLoginErrorMessage", () => {
  it("liefert Meldungen nur für bekannte Werte", () => {
    expect(oauthLoginErrorMessage("oauth_cancelled")).toContain("abgebrochen");
    expect(oauthLoginErrorMessage("oauth_failed")).toContain("fehlgeschlagen");
    expect(oauthLoginErrorMessage("<script>")).toBeNull();
    expect(oauthLoginErrorMessage(null)).toBeNull();
  });
});

describe("oauthStartErrorMessage", () => {
  it("erkennt einen nicht aktivierten Anbieter", () => {
    expect(
      oauthStartErrorMessage({
        message: "Unsupported provider: provider is not enabled",
      }),
    ).toBe("Die Anmeldung mit Google ist gerade nicht verfügbar.");
  });

  it("erkennt Verbindungsfehler und hat eine allgemeine Meldung", () => {
    expect(oauthStartErrorMessage({ message: "Failed to fetch" })).toContain(
      "Verbindung",
    );
    expect(oauthStartErrorMessage(null)).toContain("nicht gestartet");
  });
});

describe("destinationAfterCallback", () => {
  it("schickt Konten ohne Onboarding zuerst ins Onboarding", () => {
    expect(destinationAfterCallback("/dashboard", false)).toBe("/onboarding");
  });

  it("nutzt sonst das gewünschte Ziel", () => {
    expect(destinationAfterCallback("/community", true)).toBe("/community");
    expect(destinationAfterCallback("/community", null)).toBe("/community");
  });

  it("lässt den Passwort-Reset immer vorgehen", () => {
    expect(destinationAfterCallback("/reset-password", false)).toBe(
      "/reset-password",
    );
  });
});

describe("Anmeldewege", () => {
  it("liest die Anbieter aus app_metadata", () => {
    expect(
      providersFromAppMetadata({ providers: ["email", "google"] }),
    ).toEqual(["email", "google"]);
    expect(providersFromAppMetadata({ provider: "google" })).toEqual([
      "google",
    ]);
    expect(providersFromAppMetadata({ providers: [1, "google"] })).toEqual([
      "google",
    ]);
    expect(providersFromAppMetadata(undefined)).toEqual([]);
  });

  it("erkennt Konten mit Passwort", () => {
    expect(hasPasswordLogin(["email"])).toBe(true);
    expect(hasPasswordLogin(["email", "google"])).toBe(true);
    expect(hasPasswordLogin(["google"])).toBe(false);
    expect(hasPasswordLogin(undefined)).toBe(true);
    expect(hasPasswordLogin([])).toBe(true);
  });
});

describe("Migration für den Anzeigenamen", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261119120000_profile_name_from_google.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("ersetzt nur die Funktion und löscht nichts", () => {
    expect(sql).toContain(
      "create or replace function public.create_profile_from_metadata",
    );
    expect(sql.toLowerCase()).not.toMatch(/\bdrop\s/);
    expect(sql.toLowerCase()).not.toMatch(/\balter table\b/);
  });

  it("nutzt den Namen von Google als Ersatz für den Anzeigenamen", () => {
    expect(sql).toContain("meta ->> 'full_name'");
    expect(sql).toContain("meta ->> 'name'");
  });
});
