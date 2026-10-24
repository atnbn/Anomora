# Bilder und Demo-Inhalte

## Cover und Artworks

ANIMORA enthält **keine** Anime-Bilder, Screenshots oder Logos von Rechteinhabern. Die Bildrechte für eine produktive Nutzung sind nicht geklärt, deshalb werden alle Cover als austauschbare Demo-Assets erzeugt:

| Asset                        | Herkunft                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Anime-Cover, Banner, Artwork | `src/features/anime/components/anime-artwork.tsx` erzeugt abstrakte SVG-Motive aus einer Farbpalette je Serie (`art` im Katalog) |
| Bilder in Beiträgen          | dieselben generierten Artworks; Alt-Text beginnt immer mit „Demo-Artwork im Stil von …“                                          |
| Avatare                      | Initiale auf Farbfläche (`avatarHue`), erzeugt in `user-avatar.tsx`                                                              |
| Logo                         | eigene SVG-Bildmarke in `src/components/brand/logo.tsx`, angelehnt an das orange Kreis-Logo aus dem Video                        |
| Schriften                    | Plus Jakarta Sans und Barlow Condensed über `next/font/google` (SIL Open Font License)                                           |

Die Motive stellen keine Figuren dar und sind keiner echten Szene zugeordnet. Der Serientitel wird auf Postern als Text eingeblendet, damit die Zuordnung eindeutig bleibt.

`Re:ZERO` hat absichtlich kein Artwork, um den Platzhalter für fehlende Cover zu zeigen.

## Austausch gegen echte Cover

`Anime.coverUrl` hat Vorrang vor dem generierten Artwork. Sobald der AniList-Adapter (`src/lib/anime-api/anilist.ts`) aktiv ist, liefert er `coverImage.extraLarge`. Vorher klären:

1. Nutzungsbedingungen der API und Darstellung mit Quellenangabe
2. `images.remotePatterns` in `next.config.ts` für den Bild-Host ergänzen und `unoptimized` in `anime-cover.tsx` entfernen
3. Für Nutzer-Uploads (Avatare, Beitragsbilder): Supabase Storage mit Größenlimit, Moderation und RLS

## Inhaltliche Demo-Daten

Titel, Startjahr und Studio der Serien entsprechen der Realität. Beschreibungen sind eigene Kurztexte. **Erfunden** sind: Episodentitel, Episodeninhalte, Ausstrahlungstermine, Episodenzahlen laufender Serien, Bewertungen, alle Nutzer, Beiträge und Kommentare. Die UI kennzeichnet Termine und Episoden als Demo-Daten.
