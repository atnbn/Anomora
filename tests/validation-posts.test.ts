import { describe, expect, it } from "vitest";
import {
  POST_MAX_LENGTH,
  POST_MIN_LENGTH,
  isPostCategory,
  isValidAnimeId,
  postLength,
  validatePostBody,
} from "@/lib/validation/posts";

describe("validatePostBody", () => {
  it("trimmt den Text und akzeptiert die Mindestlänge", () => {
    expect(validatePostBody("  Hey  ")).toEqual({ ok: true, body: "Hey" });
  });

  it("lehnt zu kurze Texte ab, auch wenn sie nur durch Leerraum lang sind", () => {
    const result = validatePostBody("  ab \n");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(`${POST_MIN_LENGTH}`);
  });

  it("akzeptiert genau die Höchstlänge und lehnt ein Zeichen mehr ab", () => {
    expect(validatePostBody("a".repeat(POST_MAX_LENGTH)).ok).toBe(true);
    const tooLong = validatePostBody("a".repeat(POST_MAX_LENGTH + 1));
    expect(tooLong).toEqual({
      ok: false,
      error: "Dein Beitrag ist 1 Zeichen zu lang.",
    });
  });

  it("zählt Emojis wie Postgres als ein Zeichen", () => {
    expect("😀a".length).toBe(3);
    expect(postLength("😀a")).toBe(2);
    expect(validatePostBody("😀a").ok).toBe(false);
    expect(validatePostBody("😀".repeat(POST_MAX_LENGTH)).ok).toBe(true);
  });
});

describe("isPostCategory", () => {
  it("kennt alle Kategorien der Oberfläche", () => {
    for (const category of [
      "discussion",
      "fanart",
      "cosplay",
      "news",
      "collection",
    ])
      expect(isPostCategory(category)).toBe(true);
  });

  it("lehnt unbekannte Werte ab", () => {
    expect(isPostCategory("memes")).toBe(false);
    expect(isPostCategory(undefined)).toBe(false);
  });
});

describe("isValidAnimeId", () => {
  it("akzeptiert kuratierte und AniList-IDs", () => {
    expect(isValidAnimeId("a-one-piece")).toBe(true);
    expect(isValidAnimeId("a-detektiv-conan")).toBe(true);
    expect(isValidAnimeId("anilist-21")).toBe(true);
  });

  it("lehnt andere Formen ab", () => {
    expect(isValidAnimeId("21")).toBe(false);
    expect(isValidAnimeId("anilist-")).toBe(false);
    expect(isValidAnimeId("anilist-21; drop table posts")).toBe(false);
    expect(isValidAnimeId("A-One-Piece")).toBe(false);
  });
});
