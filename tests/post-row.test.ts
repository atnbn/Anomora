import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  POST_NOT_ALLOWED_MESSAGE,
  type PostRow,
  PostSaveError,
  isUuid,
  postErrorMessage,
  rowToPost,
  toPostInsert,
  toPostUpdate,
} from "@/features/community/post-row";
import {
  ANIME_ID_PATTERN,
  POST_CATEGORIES,
  POST_MAX_LENGTH,
  POST_MIN_LENGTH,
} from "@/lib/validation/posts";

const row: PostRow = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  author_id: "9b2f1c1e-0d7e-4c55-a2a4-1f0e9c3d2b11",
  body: "Frieren Folge 34 war wunderschön.",
  category: "discussion",
  anime_id: "a-frieren",
  contains_spoiler: true,
  created_at: "2026-11-17T10:00:00Z",
  edited_at: null,
};

describe("rowToPost", () => {
  it("wandelt eine Zeile in einen echten Beitrag um", () => {
    expect(rowToPost(row)).toEqual({
      id: row.id,
      authorId: row.author_id,
      body: row.body,
      animeId: "a-frieren",
      category: "discussion",
      media: [],
      containsSpoiler: true,
      createdAt: row.created_at,
      editedAt: undefined,
      baseLikeCount: 0,
      source: "supabase",
    });
  });

  it("übernimmt edited_at und lässt einen fehlenden Anime leer", () => {
    const post = rowToPost({
      ...row,
      anime_id: null,
      edited_at: "2026-11-17T11:00:00Z",
    });
    expect(post.animeId).toBeUndefined();
    expect(post.editedAt).toBe("2026-11-17T11:00:00Z");
  });

  it("fällt bei unbekannter Kategorie auf Diskussion zurück", () => {
    expect(rowToPost({ ...row, category: "memes" }).category).toBe(
      "discussion",
    );
  });
});

describe("toPostInsert", () => {
  it("trimmt den Text und übernimmt nur erlaubte Spalten", () => {
    expect(
      toPostInsert({
        body: "  Hallo Community  ",
        category: "fanart",
        animeId: "anilist-21",
        containsSpoiler: false,
      }),
    ).toEqual({
      body: "Hallo Community",
      category: "fanart",
      anime_id: "anilist-21",
      contains_spoiler: false,
    });
  });

  it("setzt anime_id auf null, wenn kein gültiger Anime gewählt ist", () => {
    const base = { body: "Hallo", category: "discussion" as const };
    expect(
      toPostInsert({ ...base, containsSpoiler: false }).anime_id,
    ).toBeNull();
    expect(
      toPostInsert({ ...base, animeId: "", containsSpoiler: false }).anime_id,
    ).toBeNull();
    expect(
      toPostInsert({ ...base, animeId: "kaputt", containsSpoiler: false })
        .anime_id,
    ).toBeNull();
  });
});

describe("toPostUpdate", () => {
  it("ändert nur Text und Spoiler-Hinweis", () => {
    expect(toPostUpdate({ body: " Neu ", containsSpoiler: true })).toEqual({
      body: "Neu",
      contains_spoiler: true,
    });
  });
});

describe("isUuid", () => {
  it("unterscheidet echte Beiträge von Demo-Beiträgen", () => {
    expect(isUuid(row.id)).toBe(true);
    expect(isUuid("p-cosplay-ruffy")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});

describe("postErrorMessage", () => {
  it("übersetzt bekannte Datenbankfehler", () => {
    expect(postErrorMessage({ code: "23503" })).toContain("Profil");
    expect(postErrorMessage({ code: "23514" })).toContain("Regeln");
    expect(postErrorMessage({ code: "42501" })).toContain("melde dich");
  });

  it("erkennt Verbindungsfehler und hat eine allgemeine Meldung", () => {
    expect(postErrorMessage(new Error("Failed to fetch"))).toContain(
      "Verbindung",
    );
    expect(postErrorMessage({ code: "XX000" })).toBe(
      "Beitrag konnte nicht gespeichert werden.",
    );
  });

  it("gibt eigene Meldungen unverändert weiter", () => {
    expect(postErrorMessage(new PostSaveError(POST_NOT_ALLOWED_MESSAGE))).toBe(
      POST_NOT_ALLOWED_MESSAGE,
    );
  });
});

describe("Migration und Formular nutzen dieselben Regeln", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261117140000_create_posts.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("nutzt dieselbe Textlänge", () => {
    expect(sql).toContain(
      `char_length(body) between ${POST_MIN_LENGTH} and ${POST_MAX_LENGTH}`,
    );
  });

  it("kennt dieselben Kategorien", () => {
    const list = POST_CATEGORIES.map((category) => `'${category}'`).join(", ");
    expect(sql).toContain(`category in (${list})`);
  });

  it("nutzt dasselbe Muster für Anime-IDs", () => {
    expect(sql).toContain(`'${ANIME_ID_PATTERN.source}'`);
  });

  it("aktiviert RLS und löscht nichts", () => {
    expect(sql).toContain("alter table public.posts enable row level security");
    expect(sql.toLowerCase()).not.toMatch(/\bdrop\s/);
  });
});
