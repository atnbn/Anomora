import { describe, expect, it } from "vitest";
import {
  type AniListMedia,
  anilistIdFromSlug,
  anilistSlug,
  mapAniListMedia,
  mergeCurated,
} from "@/lib/anime-api/anilist-mapping";

function media(overrides: Partial<AniListMedia> = {}): AniListMedia {
  return {
    id: 21,
    siteUrl: "https://anilist.co/anime/21",
    title: { romaji: "ONE PIECE", english: "One Piece", native: "ワンピース" },
    description:
      "Gold Roger was known as the Pirate King.<br><br>He was <i>caught</i>.<br>\n<br>\n<br>(Source: Crunchyroll)",
    seasonYear: 1999,
    startDate: { year: 1999 },
    status: "RELEASING",
    format: "TV",
    episodes: null,
    averageScore: 87,
    genres: ["Action", "Adventure", "Unbekanntes Genre"],
    studios: { nodes: [{ name: "Toei Animation" }] },
    coverImage: {
      extraLarge: "https://img/xl.jpg",
      large: "https://img/l.jpg",
      color: "#e4a15d",
    },
    bannerImage: null,
    nextAiringEpisode: { episode: 1101, airingAt: 1_800_000_000 },
    streamingEpisodes: [
      { title: "Episode 2 - The Great Swordsman Appears" },
      { title: "Episode 1 – I'm Luffy!" },
      { title: "Recap Special" },
    ],
    ...overrides,
  };
}

describe("Slugs", () => {
  it("baut einen lesbaren Slug mit der AniList-ID vorn", () => {
    expect(anilistSlug(21, "One Piece")).toBe("21-one-piece");
    expect(anilistSlug(5, "Frieren: Beyond Journey's End")).toBe(
      "5-frieren-beyond-journey-s-end",
    );
  });

  it("nutzt nur die ID, wenn vom Titel nichts übrig bleibt", () => {
    expect(anilistSlug(5, "!!!")).toBe("5");
  });

  it("liest die ID aus einem Slug", () => {
    expect(anilistIdFromSlug("21-one-piece")).toBe(21);
    expect(anilistIdFromSlug("21")).toBe(21);
    expect(anilistIdFromSlug("one-piece")).toBeUndefined();
    expect(anilistIdFromSlug("21abc")).toBeUndefined();
  });
});

describe("mapAniListMedia", () => {
  it("übernimmt Titel, Kennzahlen und Bilder", () => {
    const anime = mapAniListMedia(media());
    expect(anime).toMatchObject({
      id: "anilist-21",
      slug: "21-one-piece",
      title: "One Piece",
      originalTitle: "ONE PIECE",
      year: 1999,
      studio: "Toei Animation",
      status: "airing",
      score: 87,
      coverUrl: "https://img/xl.jpg",
      coverColor: "#e4a15d",
      bannerUrl: undefined,
      source: "anilist",
      anilistId: 21,
    });
  });

  it("bereinigt die Beschreibung von HTML und Quellenangaben", () => {
    expect(mapAniListMedia(media()).synopsis).toBe(
      "Gold Roger was known as the Pirate King.\n\nHe was caught.",
    );
  });

  it("übersetzt bekannte Genres und behält unbekannte", () => {
    expect(mapAniListMedia(media()).genres).toEqual([
      "Action",
      "Abenteuer",
      "Unbekanntes Genre",
    ]);
  });

  it("zählt bei laufenden Serien bis vor die nächste Episode", () => {
    const anime = mapAniListMedia(media());
    expect(anime.episodeCount).toBe(1100);
    expect(anime.nextAiring).toEqual({
      episode: 1101,
      airingAt: 1_800_000_000_000,
    });
  });

  it("nutzt für fertige Serien die Episodenzahl und kein nächstes Datum", () => {
    const anime = mapAniListMedia(
      media({ status: "FINISHED", episodes: 28, nextAiringEpisode: null }),
    );
    expect(anime.status).toBe("finished");
    expect(anime.episodeCount).toBe(28);
    expect(anime.nextAiring).toBeUndefined();
  });

  it("zählt angekündigte Serien mit 0 Episoden", () => {
    const anime = mapAniListMedia(
      media({ status: "NOT_YET_RELEASED", nextAiringEpisode: null }),
    );
    expect(anime.status).toBe("upcoming");
    expect(anime.episodeCount).toBe(0);
  });

  it("fällt auf romaji und Platzhalter zurück", () => {
    const anime = mapAniListMedia(
      media({
        title: { romaji: "Sousou no Frieren", english: null, native: null },
        studios: { nodes: [] },
        coverImage: {
          extraLarge: null,
          large: "https://img/l.jpg",
          color: null,
        },
      }),
    );
    expect(anime.title).toBe("Sousou no Frieren");
    expect(anime.originalTitle).toBeUndefined();
    expect(anime.studio).toBe("Unbekannt");
    expect(anime.coverUrl).toBe("https://img/l.jpg");
  });

  it("sortiert nur die eigenen Sendetermine und rechnet in Millisekunden", () => {
    const anime = mapAniListMedia(media(), [
      { mediaId: 21, episode: 1101, airingAt: 1_800_000_000 },
      { mediaId: 99, episode: 1, airingAt: 1_700_000_000 },
      { mediaId: 21, episode: 1100, airingAt: 1_799_395_200 },
    ]);
    expect(anime.airing).toEqual([
      { episode: 1100, airingAt: 1_799_395_200_000 },
      { episode: 1101, airingAt: 1_800_000_000_000 },
    ]);
  });

  it("liest Episodentitel aus den Streaming-Angaben", () => {
    expect(mapAniListMedia(media()).episodeTitles).toEqual({
      1: "I'm Luffy!",
      2: "The Great Swordsman Appears",
    });
    expect(
      mapAniListMedia(media({ streamingEpisodes: [] })).episodeTitles,
    ).toBeUndefined();
  });
});

describe("mergeCurated", () => {
  it("behält kuratierte Texte und übernimmt Live-Kennzahlen", () => {
    const live = mapAniListMedia(media());
    const curated = {
      ...live,
      id: "one-piece",
      slug: "one-piece",
      title: "One Piece (deutsch)",
      synopsis: "Deutsche Beschreibung",
      score: 10,
      art: {
        motif: "waves" as const,
        palette: ["#000", "#111", "#222"] as [string, string, string],
      },
    };
    const merged = mergeCurated(curated, live);
    expect(merged).toMatchObject({
      id: "one-piece",
      slug: "one-piece",
      title: "One Piece (deutsch)",
      synopsis: "Deutsche Beschreibung",
      synopsisLanguage: "de",
      score: 87,
      art: curated.art,
    });
  });
});
