# AniList-Anbindung

ANIMORA zeigt echte Anime-Daten von der öffentlichen AniList-GraphQL-API (`https://graphql.anilist.co`). Es braucht keinen API-Schlüssel.

## Grenzen der API

- **Rate-Limit:** derzeit 30 Anfragen pro Minute und IP (Header `X-RateLimit-Limit`). Bei Überschreitung antwortet AniList mit 429.
- **Nur POST:** GraphQL-Anfragen müssen per POST gehen. Der Fetch-Datencache von Next.js greift deshalb nicht; gecacht wird über `use cache`, das CDN und den Browser.

## So werden Aufrufe gespart

| Ebene           | Was                                                                                                                                             | Wo                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1. Bündeln      | Alle 12 kuratierten Serien inkl. Termine der letzten 60 und nächsten 30 Tage kommen in **einer** GraphQL-Anfrage                                | `getLiveCatalog` in `lib/anime-api/anilist.ts` |
| 2. Server-Cache | `use cache` + `cacheLife("hours")` für Katalog und Einzelserien, Suchen `hours`, allgemeine Listen `days`; Fehler nur `minutes`                 | `lib/anime-api/anilist.ts`                     |
| 3. Vorrendern   | Der Katalog wird im Root-Layout geladen und landet im statischen Seitengerüst (Revalidierung stündlich) – Seitenaufrufe lösen keine Anfrage aus | `app/layout.tsx`                               |
| 4. CDN          | Die Such-Route ist ein GET mit `Cache-Control: public, s-maxage=…`; gleiche URLs beantwortet das CDN                                            | `app/api/anime/search/route.ts`                |
| 5. Browser      | Suchergebnisse 30 Min. in Speicher + localStorage, besuchte/favorisierte Serien 7 Tage; gleichzeitige gleiche Anfragen werden zusammengelegt    | `features/anime/anime-cache.ts`                |
| 6. Eingabe      | Suche erst nach 350–400 ms Tipp-Pause und ab 2 Zeichen                                                                                          | Entdecken, globale Suche                       |

Jede echte Anfrage an AniList erscheint im Server-Log als `[anilist] Anfrage …` – so lässt sich prüfen, dass die Caches greifen.

**Gemessen** (lokal mit `next start`): Seitenaufrufe von Start, Dashboard und Detailseiten lösten keine Anfrage aus. Die erste Suche nach „frieren“ löste genau eine aus; Neuladen der Seite (Browser-Cache) und zwei direkte Aufrufe der Route von außen (Server-Cache, Antwort in rund 6 ms) keine weitere. Der Build fragt den Katalog einmal pro Build-Worker ab (bei 11 Workern 4 Anfragen).

### Hinweis für Vercel (serverless)

Der Standard-Cache von `use cache` liegt im Arbeitsspeicher einer Instanz. Auf serverless Plattformen teilen sich Instanzen diesen Speicher nicht: Revalidiert eine Seite, kann der Katalog erneut abgefragt werden – im ungünstigsten Fall einmal pro Seite und Stunde, weiterhin weit unter dem Limit. Für genau eine Anfrage pro Stunde lässt sich `getLiveCatalog` auf `"use cache: remote"` umstellen (gemeinsamer Cache der Plattform, ggf. kostenpflichtig). CDN-Cache der Suche und Browser-Cache wirken unabhängig davon.

## Ausfallsicherheit

- Ist AniList nicht erreichbar, nutzen kuratierte Serien die Demo-Daten (inkl. generierter Cover) und die Entdecken-Seite zeigt eine Fehlermeldung mit „Erneut versuchen“ plus den lokalen Katalog.
- Bei 429 antwortet die Such-Route mit 503 und `Retry-After`; es wird nicht automatisch wiederholt.
- Fehler werden nur kurz gecacht (`minutes`), damit nach einem Ausfall bald neue Daten kommen.

## Datenmodell

- Kuratierte Serien behalten ID, Slug, deutschen Titel und Beschreibung (`mergeCurated`) – Favoriten und Community-Beiträge bleiben gültig.
- Andere Serien bekommen die ID `anilist-<id>` und den Slug `<id>-<titel>`; ihre Detailseite lädt die Serie serverseitig per ID.
- Episoden werden aus Episodenzahl, Terminen (`airingSchedules`) und Titeln aus `streamingEpisodes` gebildet. AniList führt Staffeln als eigene Einträge.
- Genres werden auf Deutsch gespeichert und für Abfragen zurückübersetzt (`features/anime/genres.ts`); Erotik-Inhalte sind ausgeschlossen (`isAdult: false`).
- Beim Vorrendern dient der Abrufzeitpunkt des Katalogs als Uhrzeit, damit „ausgestrahlt/kommt noch“ schon im HTML stimmt.
