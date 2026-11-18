import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  COMMENT_NOT_ALLOWED_MESSAGE,
  type CommentRow,
  CommentSaveError,
  commentErrorMessage,
  dbTargetKey,
  rowToComment,
  toCommentInsert,
  toDbTarget,
} from "@/features/community/comment-row";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_MIN_LENGTH,
  EPISODE_NUMBER_MAX,
  isValidEpisodeNumber,
  validateCommentBody,
} from "@/lib/validation/comments";
import { ANIME_ID_PATTERN } from "@/lib/validation/posts";

const POST_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

const episodes: Record<string, { animeId: string; number: number }> = {
  "frieren-34": { animeId: "a-frieren", number: 34 },
  "21-one-piece-1155": { animeId: "anilist-21", number: 1155 },
  "kaputt-0": { animeId: "a-kaputt", number: 0 },
};
const resolve = (id: string) => episodes[id];

const row: CommentRow = {
  id: "9b2f1c1e-0d7e-4c55-a2a4-1f0e9c3d2b11",
  author_id: "11111111-2222-4333-8444-555555555555",
  post_id: POST_ID,
  anime_id: null,
  episode_number: null,
  parent_id: null,
  body: "Starke Folge!",
  contains_spoiler: false,
  created_at: "2026-11-18T10:00:00Z",
};

describe("validateCommentBody", () => {
  it("trimmt und akzeptiert die Mindestlänge", () => {
    expect(validateCommentBody("  ok  ")).toEqual({ ok: true, body: "ok" });
  });

  it("lehnt zu kurze und zu lange Texte ab", () => {
    expect(validateCommentBody(" a ")).toEqual({
      ok: false,
      error: "Schreib mindestens 2 Zeichen.",
    });
    expect(validateCommentBody("a".repeat(COMMENT_MAX_LENGTH)).ok).toBe(true);
    expect(validateCommentBody("a".repeat(COMMENT_MAX_LENGTH + 1))).toEqual({
      ok: false,
      error: "Maximal 600 Zeichen – du bist 1 drüber.",
    });
  });

  it("zählt Emojis wie Postgres als ein Zeichen", () => {
    expect(validateCommentBody("😀").ok).toBe(false);
    expect(validateCommentBody("😀!").ok).toBe(true);
  });
});

describe("isValidEpisodeNumber", () => {
  it("erlaubt 1 bis zur Höchstzahl als ganze Zahl", () => {
    expect(isValidEpisodeNumber(1)).toBe(true);
    expect(isValidEpisodeNumber(EPISODE_NUMBER_MAX)).toBe(true);
    expect(isValidEpisodeNumber(0)).toBe(false);
    expect(isValidEpisodeNumber(EPISODE_NUMBER_MAX + 1)).toBe(false);
    expect(isValidEpisodeNumber(1.5)).toBe(false);
  });
});

describe("toDbTarget", () => {
  it("nimmt echte Beiträge auf, Demo-Beiträge nicht", () => {
    expect(toDbTarget({ type: "post", postId: POST_ID }, resolve)).toEqual({
      kind: "post",
      postId: POST_ID,
    });
    expect(
      toDbTarget({ type: "post", postId: "p-cosplay-ruffy" }, resolve),
    ).toBeUndefined();
  });

  it("speichert Episoden über Anime-ID und Folgennummer", () => {
    expect(
      toDbTarget({ type: "episode", episodeId: "frieren-34" }, resolve),
    ).toEqual({ kind: "episode", animeId: "a-frieren", episodeNumber: 34 });
    expect(
      toDbTarget({ type: "episode", episodeId: "21-one-piece-1155" }, resolve),
    ).toEqual({ kind: "episode", animeId: "anilist-21", episodeNumber: 1155 });
  });

  it("lässt unbekannte oder ungültige Episoden im Demo-Store", () => {
    expect(
      toDbTarget({ type: "episode", episodeId: "gibt-es-nicht-1" }, resolve),
    ).toBeUndefined();
    expect(
      toDbTarget({ type: "episode", episodeId: "kaputt-0" }, resolve),
    ).toBeUndefined();
  });
});

describe("dbTargetKey", () => {
  it("unterscheidet Beiträge und Episoden", () => {
    expect(dbTargetKey({ kind: "post", postId: POST_ID })).toBe(
      `post:${POST_ID}`,
    );
    expect(
      dbTargetKey({ kind: "episode", animeId: "a-frieren", episodeNumber: 34 }),
    ).toBe("episode:a-frieren:34");
  });
});

describe("rowToComment", () => {
  it("übernimmt das Ziel aus dem Ladekontext", () => {
    const target = { type: "post", postId: POST_ID } as const;
    expect(rowToComment(row, target)).toEqual({
      id: row.id,
      authorId: row.author_id,
      target,
      parentId: undefined,
      body: "Starke Folge!",
      containsSpoiler: false,
      createdAt: row.created_at,
      baseLikeCount: 0,
      source: "supabase",
    });
  });

  it("übernimmt Antworten und Spoiler", () => {
    const comment = rowToComment(
      { ...row, parent_id: POST_ID, contains_spoiler: true },
      { type: "episode", episodeId: "frieren-34" },
    );
    expect(comment.parentId).toBe(POST_ID);
    expect(comment.containsSpoiler).toBe(true);
  });
});

describe("toCommentInsert", () => {
  it("setzt für Beiträge nur post_id", () => {
    expect(
      toCommentInsert(
        { kind: "post", postId: POST_ID },
        { body: "  Hallo  ", containsSpoiler: false },
      ),
    ).toEqual({
      post_id: POST_ID,
      anime_id: null,
      episode_number: null,
      parent_id: null,
      body: "Hallo",
      contains_spoiler: false,
    });
  });

  it("setzt für Episoden Anime und Folge und übernimmt die Antwort", () => {
    expect(
      toCommentInsert(
        { kind: "episode", animeId: "a-frieren", episodeNumber: 34 },
        { body: "Ja!", parentId: row.id, containsSpoiler: true },
      ),
    ).toEqual({
      post_id: null,
      anime_id: "a-frieren",
      episode_number: 34,
      parent_id: row.id,
      body: "Ja!",
      contains_spoiler: true,
    });
  });
});

describe("commentErrorMessage", () => {
  it("übersetzt bekannte Datenbankfehler", () => {
    expect(commentErrorMessage({ code: "23503" })).toContain("existiert nicht");
    expect(commentErrorMessage({ code: "23514" })).toContain("Regeln");
    expect(commentErrorMessage({ code: "42501" })).toContain("melde dich");
    expect(commentErrorMessage(new Error("Failed to fetch"))).toContain(
      "Verbindung",
    );
    expect(commentErrorMessage({ code: "XX000" })).toBe(
      "Kommentar konnte nicht gespeichert werden.",
    );
  });

  it("gibt eigene Meldungen unverändert weiter", () => {
    expect(
      commentErrorMessage(new CommentSaveError(COMMENT_NOT_ALLOWED_MESSAGE)),
    ).toBe(COMMENT_NOT_ALLOWED_MESSAGE);
  });
});

describe("Migration und Formular nutzen dieselben Regeln", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261118120000_create_comments.sql",
      import.meta.url,
    ),
    "utf8",
  );

  it("nutzt dieselbe Textlänge", () => {
    expect(sql).toContain(
      `char_length(body) between ${COMMENT_MIN_LENGTH} and ${COMMENT_MAX_LENGTH}`,
    );
  });

  it("nutzt dieselben Grenzen für Anime-ID und Folgennummer", () => {
    expect(sql).toContain(`'${ANIME_ID_PATTERN.source}'`);
    expect(sql).toContain(`episode_number between 1 and ${EPISODE_NUMBER_MAX}`);
  });

  it("erlaubt genau ein Ziel und prüft Antworten", () => {
    expect(sql).toContain("constraint comments_one_target");
    expect(sql).toContain("create trigger comments_check_parent");
  });

  it("aktiviert RLS, erlaubt kein Bearbeiten und löscht nichts", () => {
    expect(sql).toContain(
      "alter table public.comments enable row level security",
    );
    expect(sql).not.toMatch(/grant update/i);
    expect(sql.toLowerCase()).not.toMatch(/\bdrop\s/);
  });
});
