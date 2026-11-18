import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  countsByIds,
  isDuplicateEntry,
  likeErrorMessage,
  resolveLikeState,
} from "@/features/community/like-row";

describe("countsByIds", () => {
  it("übernimmt Zahlen und setzt fehlende IDs auf 0", () => {
    expect(
      countsByIds(
        ["a", "b", "c"],
        [
          { post_id: "a", like_count: 3 },
          { post_id: "c", like_count: "12" },
        ],
        "post_id",
      ),
    ).toEqual({ a: 3, b: 0, c: 12 });
  });

  it("ignoriert Zeilen ohne passende ID-Spalte", () => {
    expect(
      countsByIds(["a"], [{ comment_id: "a", like_count: 5 }], "post_id"),
    ).toEqual({ a: 0 });
  });
});

describe("resolveLikeState", () => {
  it("rechnet für Demo-Inhalte mit fester Zahl und lokalem Like", () => {
    expect(
      resolveLikeState({
        baseLikeCount: 324,
        localLiked: true,
        remoteLiked: false,
      }),
    ).toEqual({ likeCount: 325, liked: true });
  });

  it("nutzt für echte Inhalte die Zahl aus der Datenbank", () => {
    expect(
      resolveLikeState({
        baseLikeCount: 0,
        remoteCount: 4,
        localLiked: false,
        remoteLiked: true,
      }),
    ).toEqual({ likeCount: 4, liked: true });
  });

  it("zählt einen fremden Like mit, markiert ihn aber nicht als eigenen", () => {
    expect(
      resolveLikeState({
        baseLikeCount: 0,
        remoteCount: 1,
        localLiked: false,
        remoteLiked: false,
      }),
    ).toEqual({ likeCount: 1, liked: false });
  });
});

describe("Fehler", () => {
  it("erkennt doppelte Likes", () => {
    expect(isDuplicateEntry({ code: "23505" })).toBe(true);
    expect(isDuplicateEntry({ code: "23503" })).toBe(false);
    expect(isDuplicateEntry(null)).toBe(false);
  });

  it("übersetzt Fehler für Likes und Lesezeichen", () => {
    expect(likeErrorMessage({ code: "23503" }, "like")).toContain(
      "existiert nicht mehr",
    );
    expect(likeErrorMessage({ code: "42501" }, "save")).toContain("melde dich");
    expect(likeErrorMessage(new Error("Failed to fetch"), "like")).toContain(
      "Verbindung",
    );
    expect(likeErrorMessage({ code: "XX000" }, "like")).toBe(
      "Like konnte nicht gespeichert werden.",
    );
    expect(likeErrorMessage({ code: "XX000" }, "save")).toBe(
      "Lesezeichen konnte nicht gespeichert werden.",
    );
  });
});

describe("Migration", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261118160000_create_likes.sql",
      import.meta.url,
    ),
    "utf8",
  );
  const tables = ["post_likes", "comment_likes", "post_saves"];

  it("aktiviert RLS für alle drei Tabellen", () => {
    for (const table of tables)
      expect(sql).toContain(
        `alter table public.${table} enable row level security`,
      );
  });

  it("erlaubt jeden Like nur einmal je Konto", () => {
    expect(sql).toContain("primary key (post_id, user_id)");
    expect(sql).toContain("primary key (comment_id, user_id)");
  });

  it("gibt anon keinen Zugriff auf einzelne Einträge und erlaubt kein Ändern", () => {
    for (const table of tables)
      expect(sql).not.toMatch(
        new RegExp(`grant [^;]*on table public\\.${table} to anon`),
      );
    expect(sql).not.toMatch(/grant update/i);
  });

  it("liefert Zahlen für alle und löscht nichts", () => {
    expect(sql).toContain(
      "grant execute on function public.post_like_counts(uuid[])\n  to anon, authenticated",
    );
    expect(sql.toLowerCase()).not.toMatch(/\bdrop\s/);
  });
});
