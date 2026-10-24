export type AnimeStatus = "airing" | "finished" | "upcoming" | "hiatus";

export type ArtMotif =
  "sun" | "moon" | "rays" | "rings" | "waves" | "peaks" | "shards" | "stars";

/** Gestaltungsparameter für die generierten Demo-Cover (siehe docs/ASSETS.md). */
export type AnimeArt = {
  motif: ArtMotif;
  /** Hintergrund, Mittelton, Akzent – als CSS-Farbwerte. */
  palette: [string, string, string];
};

/** Ausstrahlungstermin einer Episode laut AniList (Zeit in Millisekunden). */
export type AiringSlot = { episode: number; airingAt: number };

export type Anime = {
  id: string;
  slug: string;
  title: string;
  /** Originaltitel in Umschrift, falls abweichend. */
  originalTitle?: string;
  synopsis: string;
  /** Sprache der Beschreibung – AniList liefert nur Englisch. */
  synopsisLanguage?: "de" | "en";
  year: number;
  studio: string;
  status: AnimeStatus;
  genres: string[];
  /** Anzahl erschienener Episoden. */
  episodeCount: number;
  /** 0–100. */
  score: number;
  /** Generiertes Demo-Artwork (fehlt bei einzelnen Einträgen bewusst). */
  art?: AnimeArt;
  /** Cover von AniList. */
  coverUrl?: string;
  /** Dominante Coverfarbe als Platzhalter, während das Bild lädt. */
  coverColor?: string;
  /** Breites Bannerbild von AniList, falls vorhanden. */
  bannerUrl?: string;
  /** Herkunft der Daten. */
  source?: "demo" | "anilist";
  anilistId?: number;
  siteUrl?: string;
  /** Nächste angekündigte Episode. */
  nextAiring?: AiringSlot;
  /** Bekannte Termine der letzten und kommenden Episoden. */
  airing?: AiringSlot[];
  /** Episodentitel nach Nummer (aus den Streaming-Angaben bei AniList). */
  episodeTitles?: Record<number, string>;
};

export type Episode = {
  id: string;
  animeId: string;
  number: number;
  /** Fehlt, wenn die Quelle keinen Titel liefert. */
  title?: string;
  /** ISO-Zeitpunkt der Ausstrahlung; fehlt, wenn die Quelle keinen Termin kennt. */
  airDate?: string;
  synopsis?: string;
  durationMinutes: number;
  /** Echte Termine werden nicht mit der Demo-Uhr verschoben. */
  live?: boolean;
};

export type AnimeSort = "popular" | "score" | "newest" | "title";
