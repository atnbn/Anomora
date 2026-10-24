# Bilder, Daten und Demo-Inhalte

## Anime-Daten und Bilder von AniList

Cover, Banner, Status, Episodenzahlen, Ausstrahlungstermine, Bewertungen, Genres und Studios kommen live von der öffentlichen [AniList-API](https://anilist.co) (siehe `docs/ANILIST.md`). Die Bilder werden direkt vom AniList-CDN (`s4.anilist.co`) geladen, nicht über unseren Server; die Quelle ist auf Entdecken, Detailseiten und der Startseite angegeben.

Vor einem produktiven Einsatz klären:

1. [Nutzungsbedingungen von AniList](https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/terms-of-use) – die API ist für nicht-kommerzielle Nutzung frei; kommerzielle Nutzung braucht eine Absprache.
2. Bildrechte der Cover liegen bei den Rechteinhabern; Anzeige mit Quellenangabe, keine Weiterverarbeitung.

## Generierte Demo-Assets

| Asset               | Herkunft                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Bilder in Beiträgen | `src/features/anime/components/anime-artwork.tsx` erzeugt abstrakte SVG-Motive je Serie; Alt-Text beginnt mit „Demo-Artwork im Stil von …“ |
| Fallback-Cover      | dieselben Motive, wenn AniList nicht erreichbar ist                                                                                        |
| Avatare             | Initiale auf Farbfläche (`avatarHue`), erzeugt in `user-avatar.tsx`                                                                        |
| Logo                | eigene SVG-Bildmarke in `src/components/brand/logo.tsx`, angelehnt an das orange Kreis-Logo aus dem Video                                  |
| Schriften           | Plus Jakarta Sans und Barlow Condensed über `next/font/google` (SIL Open Font License)                                                     |

Beitragsbilder nutzen bewusst nie die offiziellen Cover (`preferArt`), damit sie nicht wie Fotos von Nutzerinnen und Nutzern wirken. Die Motive stellen keine Figuren dar.

Für Nutzer-Uploads (Avatare, Beitragsbilder) fehlt noch Supabase Storage mit Größenlimit, Moderation und RLS.

## Inhaltliche Demo-Daten

- **Kuratierte Serien** (`src/data/demo/anime.ts`): deutsche Titel und Beschreibungen sind eigene Texte, alles Messbare kommt von AniList. Die Demo-Werte dienen nur als Fallback.
- **Andere Serien** (aus der Suche): Beschreibung stammt von AniList und ist nur auf Englisch verfügbar – das wird angezeigt.
- **Erfunden** sind alle Nutzer, Beiträge, Kommentare, Meldungen und Sperren sowie die Episodentitel und -inhalte im Fallback-Modus. Beispiel-Diskussionen hängen an Demo-Episodennummern; zu echten aktuellen Folgen gibt es anfangs noch keine Kommentare.
