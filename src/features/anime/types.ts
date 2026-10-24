export type AnimeStatus = "airing" | "finished" | "upcoming" | "hiatus";

export type ArtMotif =
  "sun" | "moon" | "rays" | "rings" | "waves" | "peaks" | "shards" | "stars";

/** Gestaltungsparameter für die generierten Demo-Cover (siehe docs/ASSETS.md). */
export type AnimeArt = {
  motif: ArtMotif;
  /** Hintergrund, Mittelton, Akzent – als CSS-Farbwerte. */
  palette: [string, string, string];
};

export type Anime = {
  id: string;
  slug: string;
  title: string;
  /** Originaltitel in Umschrift, falls abweichend. */
  originalTitle?: string;
  synopsis: string;
  year: number;
  studio: string;
  status: AnimeStatus;
  genres: string[];
  /** Anzahl erschienener Episoden in den Demo-Daten (nicht die echte Zahl). */
  episodeCount: number;
  /** 0–100, Demo-Wert. */
  score: number;
  /** Fehlt bewusst bei einzelnen Einträgen, um den Platzhalter zu zeigen. */
  art?: AnimeArt;
  /** Externe Cover-URL, sobald eine Anime-API angebunden ist. */
  coverUrl?: string;
};

export type Episode = {
  id: string;
  animeId: string;
  number: number;
  /** Fehlt, wenn die Quelle keinen Titel liefert. */
  title?: string;
  /** ISO-Zeitpunkt der Ausstrahlung. */
  airDate: string;
  synopsis?: string;
  durationMinutes: number;
};

export type AnimeSort = "popular" | "score" | "newest" | "title";
