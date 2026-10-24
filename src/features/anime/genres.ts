/**
 * AniList-Genres (englisch) mit deutschen Bezeichnungen.
 * Gespeichert und angezeigt wird Deutsch; für Abfragen an AniList wird
 * zurückübersetzt. Erotik-Genres sind bewusst nicht enthalten.
 */
export const ANILIST_GENRES = {
  Action: "Action",
  Adventure: "Abenteuer",
  Comedy: "Comedy",
  Drama: "Drama",
  Fantasy: "Fantasy",
  Horror: "Horror",
  "Mahou Shoujo": "Mahou Shoujo",
  Mecha: "Mecha",
  Music: "Musik",
  Mystery: "Mystery",
  Psychological: "Psychologisch",
  Romance: "Romantik",
  "Sci-Fi": "Sci-Fi",
  "Slice of Life": "Slice of Life",
  Sports: "Sport",
  Supernatural: "Übernatürlich",
  Thriller: "Thriller",
} as const;

export type AniListGenre = keyof typeof ANILIST_GENRES;

export function genreToGerman(genre: string): string {
  return ANILIST_GENRES[genre as AniListGenre] ?? genre;
}

export function genreToAniList(label: string): AniListGenre | undefined {
  const entry = Object.entries(ANILIST_GENRES).find(
    ([english, german]) => german === label || english === label,
  );
  return entry?.[0] as AniListGenre | undefined;
}

/** Deutsche Genre-Bezeichnungen für Filter, alphabetisch. */
export const GENRE_OPTIONS = Object.values(ANILIST_GENRES).toSorted((a, b) =>
  a.localeCompare(b, "de"),
);
