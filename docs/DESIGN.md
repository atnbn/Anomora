# ANIMORA – Video-Analyse und Gestaltungsrichtung

## Quelle

Ausgewertet wurde `WhatsApp Video 2026-10-22 at 20.44.53.mp4` (1920 × 1080, 5:53 min) über Einzelbilder in 6-Sekunden-Abständen und Vollbild-Ausschnitte der Schlüsselfolien. Das Video ist eine **Pitch-Präsentation mit statischen Mockups**, keine Aufnahme einer laufenden App. Übergänge zwischen echten Screens, Hover-Zustände oder Animationen innerhalb der App sind daher **nicht** zu sehen.

## 1. Im Video beobachtet

| Folie                   | Inhalt                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro                   | Illustriertes Logo (orange Feuer-Kreis mit Figur), Wortmarke „ANIMORA“ in Serifen-Versalien, dunkelgrüner Folienhintergrund                                                                                                                                                                                                                                                                                |
| „Die Idee“ (Mobile)     | Neun nummerierte Phone-Mockups: 1 App-Start (Logo, „MORE THAN ANIME“, Ladebalken), 2 Willkommen mit „Registrieren“ / „Anmelden“ / „Weiter als Gast“, 3 „Wähle deine Lieblings-Animes“ (Suche + 3-spaltiges Cover-Raster, Mehrfachauswahl), 4 „Wähle dein Design“ (Anime-Themes + „Schlicht (Modern)“ + „Eigenes Design (später)“), 5 Dashboard „Willkommen zurück“                                         |
| Dashboard (Mobile)      | Header mit Logo, Suche, Glocke, Avatar; Hero-Artwork mit Zitat; Karte „Nächste Folge“ mit Datum, Episodennummer, Titel und Countdown (Tage / Stunden / Minuten); „Was bisher geschah“ mit Button „Zur Diskussion“; „Neuigkeiten & Highlights“                                                                                                                                                              |
| Community-Feed (Mobile) | Filter-Chips „Für dich / One Piece / Folge-Diskussionen“, Composer „Was begeistert dich gerade?“ mit Bild/Emoji/GIF und „Posten“, Beitragskarten mit Avatar, Name, Zeit, Text, Bild, Like-, Kommentar-, Teilen- und Merken-Aktion, schwebender Plus-Button                                                                                                                                                 |
| Profil (Mobile)         | Banner, großer Avatar, Name mit Verifiziert-Haken, Handle, Listeneinträge „Profil bearbeiten“, „Design & Theme“, „Einstellungen“, „Meine Beiträge“ (+ Coins/Skins – außerhalb MVP)                                                                                                                                                                                                                         |
| „Individuell“           | Gleicher Ablauf mit Dragon-Ball-Theme; zusätzlich Tab-Bar unten: Dashboard, For You, Diskussion, Shop; Profil mit Kennzahlen Beiträge / Follower / Folge ich                                                                                                                                                                                                                                               |
| Community (Desktop)     | Dunkles Drei-Spalten-Layout: linke Navigation (Dashboard, For You, Diskussion, Shop, Benachrichtigungen mit Zähler, Nachrichten) + „Meine Anime“ mit Mini-Covern; Feed mit Composer, Tabs „Alle Beiträge / Folge ich / Beliebt / Nur Anime / Nur Cosplay / Nur News“; rechte Spalte „Trendende Themen“ (nummeriert), „Vorgeschlagene User“ mit „Folgen“, „Beliebte Beiträge“, „Online in deiner Community“ |
| Episodendiskussion      | Hero mit Anime-Name, Episode „1123 – Die Wahrheit im Schatten“, Datum, Play-Button; Tabs „Diskussion / Zusammenfassung / Theorien / Charaktere / Nächste Folge“; Kommentarliste mit Sortierung „Neueste zuerst“, Likes, Antworten, Bildvergleich; rechts Episodenkarte, „Schnellzugriff“, „Top-Kommentare“, „Beliebte Themen“                                                                              |
| Händler, Shop, Umsatz   | Händler-Dashboard, Shop-Startseite, Umsatzmodell – **nicht Bestandteil des MVP**                                                                                                                                                                                                                                                                                                                           |

Beobachtete visuelle Merkmale: warmes Anthrazit (fast schwarz) als Grundfläche, Orange als einzige Akzentfarbe (Buttons, aktive Navigation, Zahlen, Links „Alle anzeigen“), weiße oder dunkle Karten mit ca. 12–16 px Radius, runde Avatare, Pill-Chips, kräftige Cover-Artworks, Badges „Plus / Pro / Premium“ (Premium außerhalb MVP).

## 2. Aus der Produktbeschreibung abgeleitet

Anmelden/Registrieren als echte Formulare, E-Mail-Bestätigung, Passwort zurücksetzen, Entdecken mit Filtern, Folgen/Entfolgen, Melden, Blockieren, Einstellungen und Moderation. Diese Screens kommen im Video nicht vor.

## 3. Eigene Gestaltungsentscheidungen

- **Ein Theme-System statt Anime-Themes**: Hell/Dunkel plus fünf Akzentfarben. Markengebundene Themes („One Piece Theme“) sind lizenzrechtlich heikel; die Personalisierung bleibt über das Hero-Artwork des Lieblings-Anime erhalten.
- **Ruhigere Flächen als im Video**: keine Feuer-Hintergründe hinter der Navigation, keine Verläufe auf Karten. Orange erscheint nur auf interaktiven oder hervorgehobenen Elementen.
- **Lesbarkeit**: Fließtext 15 px statt der im Video oft sehr kleinen 11–12 px; Sekundärtext mit mindestens 4.5:1 Kontrast.
- **Mobile**: untere Tab-Leiste (wie im Video) mit fünf Zielen und 48 px Touch-Höhe; Desktop-Seitenleisten werden auf Mobilgeräten zu Abschnitten unterhalb des Hauptinhalts oder entfallen.
- **Spoilerschutz** als eigenes Muster: verschwommener Text mit „Spoiler anzeigen“, standardmäßig aktiv für Episoden, die als nicht gesehen markiert sind.
- **Demo-Cover**: Statt urheberrechtlich geschützter Anime-Bilder erzeugt `AnimeCover` abstrakte, je Anime eigene SVG-Artworks (siehe `docs/ASSETS.md`).

## Design-Tokens

Definiert in `src/app/globals.css`.

| Token          | Dunkel                 | Hell             | Verwendung                        |
| -------------- | ---------------------- | ---------------- | --------------------------------- |
| `--background` | warmes Anthrazit       | warmes Off-White | Seitenfläche                      |
| `--card`       | eine Stufe heller      | Weiß             | Karten, Listen                    |
| `--muted`      | Flächen für Chips      | helles Grau      | inaktive Chips, Skeletons         |
| `--primary`    | Akzent (Standard Glut) | gleicher Akzent  | Primäraktionen, aktive Navigation |
| `--border`     | 8 % Weiß               | 8 % Schwarz      | Kartenränder, Trenner             |
| Radius         | 6 / 10 / 14 / 20 px    |                  | Chips · Inputs · Karten · Hero    |
| Schrift        | Plus Jakarta Sans      |                  | UI und Fließtext                  |
| Display        | Barlow Condensed       |                  | Episodennummern, Countdown, Hero  |
| Bewegung       | 150–200 ms, ease-out   |                  | aus bei `prefers-reduced-motion`  |

Raster: 4-px-Basis, Inhaltsbreite max. 1240 px, Drei-Spalten-Layout ab 1280 px (Navigation 240 px · Inhalt · Seitenleiste 320 px), zwei Spalten ab 1024 px, eine Spalte darunter.
