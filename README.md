# ANIMORA – Anime-Community

Eine Community-Plattform für Anime-Fans: Serien entdecken, Episoden verfolgen und spoilergeschützt mit anderen diskutieren. Ein eigenes Projekt, an dem ich KI-gestützte Entwicklung mit Claude Code übe – von der Spezifikation bis zum Review.

**Live:** https://anomora-umber.vercel.app

**Technik:** Next.js (App Router), React, TypeScript im Strict Mode, Supabase (Auth und Postgres mit Row Level Security), Tailwind CSS, shadcn/ui, Vitest, GitHub Actions und Vercel.

## Stand

| Bereich                                           | Stand                                                       |
| ------------------------------------------------- | ----------------------------------------------------------- |
| Registrierung, Anmeldung, Passwort, E-Mail ändern | echt über Supabase Auth                                     |
| Profile (Nutzername, Anzeigename, Beschreibung)   | echt in der Tabelle `profiles` mit RLS                      |
| Beiträge (erstellen, bearbeiten, löschen)         | echt in der Tabelle `posts` mit RLS                         |
| Anime, Episoden, Sendetermine, Suche              | echt von AniList, gecacht auf Server, CDN und im Browser    |
| Kommentare und Antworten                          | echt in der Tabelle `comments` mit RLS                      |
| Likes und Lesezeichen                             | echt in `post_likes`, `comment_likes`, `post_saves` mit RLS |
| Folgen, Favoriten, Moderation                     | Demo-Daten im Browser, siehe [Demo-Modus](docs/DEMO.md)     |

Die Oberfläche ist für alle Bereiche fertig. Die Demo-Bereiche werden nach und nach auf Supabase-Tabellen umgestellt, ohne dass sich die Oberfläche ändert.

## So arbeite ich

1. **Spezifikation:** Neue Features beginnen mit einem kurzen Dokument in [`docs/specs/`](docs/specs/) – Ziel, Datenmodell, Rechte und offene Fragen.
2. **Umsetzung mit Claude Code:** Der Agent setzt die Spezifikation um, ich gebe die Richtung vor.
3. **Review:** Ich lese jeden Diff selbst, bevor er committet wird.
4. **Tests:** Vitest prüft die Logik, z. B. ob die Regeln der Datenbank und der Formulare übereinstimmen.
5. **CI:** GitHub Actions prüft jeden Pull Request mit Formatierung, Lint, TypeScript, Tests und Build.

Beispiele: [Profiltabelle mit RLS](docs/specs/profiles.md), [Beiträge als erste Community-Tabelle](docs/specs/posts.md), [Kommentare](docs/specs/comments.md), [Likes](docs/specs/likes.md).

## Lokal starten

Voraussetzung: Node.js 22 LTS oder neuer mit npm.

```powershell
npm.cmd install
copy .env.example .env.local
npm.cmd run dev
```

Trage in `.env.local` die URL und den Publishable Key deines Supabase-Projekts ein (siehe [docs/SUPABASE.md](docs/SUPABASE.md)). Öffne danach http://localhost:3000.

- **Registrieren** legt ein echtes Konto an: E-Mail bestätigen, dann Onboarding.
- **Demo ansehen** öffnet ohne Anmeldung das Beispielkonto **StrawHatMax**. Dort gibt es auch „Demo: als Moderatorin anmelden“.

## Befehle

| Befehl                 | Bedeutung                                                |
| ---------------------- | -------------------------------------------------------- |
| `npm.cmd run dev`      | Entwicklungsserver starten                               |
| `npm.cmd run test`     | Tests mit Vitest ausführen                               |
| `npm.cmd run check`    | Formatierung, Lint, TypeScript und Tests – wie in der CI |
| `npm.cmd run build`    | Produktionsversion erstellen                             |
| `npm.cmd start`        | Erstellte Produktionsversion starten                     |
| `npm.cmd run lint:fix` | Automatisch behebbare Lint-Probleme korrigieren          |
| `npm.cmd run format`   | Dateien formatieren                                      |

## Umfang

- **Öffentlich:** Landingpage, Anmelden, Registrieren, E-Mail-Bestätigung, Passwort vergessen und zurücksetzen, rechtliche Seiten (Vorlagen mit Platzhaltern), 404- und Fehlerseiten
- **Onboarding:** Profil, Lieblings-Anime, Darstellung mit Spoilerschutz
- **App:** Dashboard, Entdecken, Anime-Detail mit Episoden, Episodendiskussion mit Spoilerschutz, Meine Anime, Community-Feed, öffentliche Profile mit Followern
- **Einstellungen:** Profil, Konto und Sicherheit, Darstellung, blockierte Nutzer
- **Moderation** (nur für Moderationskonten): Meldungen, Inhalte entfernen und wiederherstellen, Nutzer sperren, Protokoll

## Nächste Schritte

- Tabellen mit RLS für `follows`, `favorites`, `blocks`, `reports`, `moderation_actions` und `episode_progress`
- Moderation serverseitig: Rechteprüfung über `profiles.role` und Server Actions
- Supabase Storage für Avatare und Beitragsbilder

## Dokumentation

- [Einstieg in Next.js](docs/EINSTIEG.md): Begriffe, Ordnerstruktur, Server und Client Components, Tailwind und shadcn
- [Projektstruktur](docs/PROJEKTSTRUKTUR.md): Ordner, Route Groups und Aufteilung nach Features
- [Supabase](docs/SUPABASE.md): Cloud-Anbindung, Profil-, Beitrags-, Kommentar- und Like-Tabellen, Migrationen und Umgebungsvariablen
- [AniList-Anbindung](docs/ANILIST.md): echte Anime-Daten, Rate-Limit und Caching
- [Demo-Modus](docs/DEMO.md): was simuliert ist und wie die Demo-Daten gespeichert werden
- [Deployment](docs/DEPLOYMENT.md): GitHub Actions, Vercel, Previews und Production
- [Git-Workflow](docs/GIT-WORKFLOW.md): Branch-Strategie
- [Design](docs/DESIGN.md): Screen-Inventar, Gestaltungsrichtung und Design-Tokens
- [Bilder und Demo-Inhalte](docs/ASSETS.md): Herkunft aller Bilder und Daten
