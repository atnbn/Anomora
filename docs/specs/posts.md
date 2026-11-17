# Spezifikation: Beiträge als erste echte Community-Tabelle (Schritt 3)

Status: umgesetzt (PR #8) und am 17.11.2026 in der Cloud angewendet · Branch: `feat/posts-table`

## Ziel

Beiträge von Supabase-Konten liegen dauerhaft in einer Tabelle `public.posts` statt im Browser. Alle Besucher sehen dieselben echten Beiträge, und die Datenbank stellt mit Row Level Security (RLS) sicher, dass nur der Autor seinen Beitrag ändern oder löschen kann. Damit ist `posts` die erste Community-Tabelle; Likes, Kommentare und Moderation folgen nach demselben Muster.

## Ausgangslage

- Beiträge entstehen im Demo-Store (`demoActions.createPost`, `updatePost`, `deletePost` in `src/features/demo/store.ts`) und liegen in `localStorage`. Nur der eigene Browser sieht sie.
- `usePosts()` in `src/features/community/hooks.ts` mischt Demo-Beiträge (`src/data/demo/posts.ts`) mit lokal erstellten und ist die einzige Quelle für Feed, Detailseite, Profil, Anime-Seite, Seitenleiste und Suche.
- Post-Karten holen den Autor synchron über `getUserByIdSync` (`src/lib/data/users.ts`). Dort sind nur Demo-Profile und das eigene Konto bekannt, nicht andere echte Nutzer.
- Die Längenprüfung (3–1000 Zeichen) steht doppelt in `post-composer.tsx` und `edit-post-dialog.tsx`.
- `public.profiles` mit RLS existiert (siehe [profiles.md](profiles.md)); `posts` verweist darauf.

## Umfang

1. **Migration** `supabase/migrations/20261117140000_create_posts.sql`: Tabelle, Constraints, Indizes, RLS, Spaltenrechte, Trigger für `edited_at`. Sie legt nur an und löscht nichts.
2. **Eingabeprüfung** in `src/lib/validation/posts.ts` (Länge, Kategorie, Anime-ID), genutzt von Composer und Bearbeiten-Dialog.
3. **Umwandlung** Tabellenzeile ↔ `Post` in `src/features/community/post-row.ts`, ohne Supabase-Client und damit testbar. Öffentliche Profile anderer Nutzer wandelt `rowToUserProfile` in `src/features/profiles/profile-row.ts` um.
4. **Datenzugriff** in `src/features/community/posts-supabase.ts`: Liste laden (mit Autorprofil), einzelnen Beitrag nachladen, erstellen, bearbeiten, löschen. `src/features/community/post-actions.ts` entscheidet je Sitzung bzw. Beitrag zwischen Tabelle und Demo-Store.
5. **Autorprofile**: geladene Profile anderer Nutzer in `src/lib/data/users.ts` registrieren, damit `getUserByIdSync` sie findet (wie `live-registry.ts` für Anime). `/u/[username]` lädt unbekannte Profile über `src/features/profiles/profiles-supabase.ts` nach.
6. **Oberfläche**: `usePosts()` und die Moderationsansicht nehmen echte Beiträge auf; Composer, Bearbeiten und Löschen schreiben bei Supabase-Konten in die Tabelle.
7. **Tests** (Vitest) für Eingabeprüfung, Umwandlung und Übereinstimmung von Migration und Formularregeln.
8. **Doku**: `docs/SUPABASE.md`, `docs/DEMO.md` und README („Stand“, „Nächste Schritte“).

## Nicht im Umfang

- Bilder in Beiträgen (Supabase Storage, Schritt „Storage“). Echte Beiträge haben keine Medien; der Button für Demo-Artworks erscheint nur, wenn der Beitrag im Demo-Store landet.
- Likes, Speichern, Kommentare, Melden und Blockieren in der Datenbank. Sie bleiben im Demo-Store und funktionieren über die Beitrags-ID auch für echte Beiträge, aber nur lokal.
- Moderation und Sperren serverseitig (eigener Schritt mit Server Actions und `profiles.role`). Bis dahin kann ein Moderator echte Beiträge nur lokal ausblenden.
- Bezug auf Episoden (`episode_id`): der Composer setzt ihn heute nicht. Die Spalte kommt mit den Episoden-Diskussionen.
- Echtzeit-Updates (Supabase Realtime), Endlos-Scrollen, Volltextsuche. Feed und Profilseiten zeigen die 50 neuesten echten Beiträge.
- Datenbanktests mit pgTAP (brauchen Docker); RLS wird stattdessen manuell nach der Checkliste unten geprüft.

## Datenmodell `public.posts`

| Spalte             | Typ           | Regeln                                                                                    |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------- |
| `id`               | `uuid`        | Primärschlüssel, Standard `gen_random_uuid()`                                             |
| `author_id`        | `uuid`        | Pflicht, Standard `auth.uid()`, verweist auf `profiles(id)`, `on delete cascade`          |
| `body`             | `text`        | Pflicht, ohne Leerraum am Anfang/Ende, 3–1000 Zeichen                                     |
| `category`         | `text`        | `discussion`, `fanart`, `cosplay`, `news` oder `collection`; Standard `discussion`        |
| `anime_id`         | `text`        | optional, kuratiert (`a-one-piece`) oder AniList (`anilist-21`), siehe `ANIME_ID_PATTERN` |
| `contains_spoiler` | `boolean`     | Pflicht, Standard `false`                                                                 |
| `created_at`       | `timestamptz` | Standard `now()`                                                                          |
| `edited_at`        | `timestamptz` | `null`, bis `body` oder `contains_spoiler` geändert wird; dann per Trigger auf `now()`    |

Indizes: `(created_at desc)` für den Feed, `(author_id, created_at desc)` für Profilseiten, `(anime_id, created_at desc) where anime_id is not null` für Anime-Seiten.

Die Grenzen stehen in `src/lib/validation/posts.ts`; ein Test prüft, dass die Migration dieselben Werte nutzt. Gezählt wird wie in Postgres (`char_length`), ein Emoji also als ein Zeichen. Die Datenbank prüft zusätzlich, weil die Prüfung im Browser umgangen werden kann. `anime_id` ist bewusst kein Fremdschlüssel: Anime kommen von AniList und liegen nicht in der Datenbank. Kuratierte Anime behalten ihre eigenen IDs (`a-…`), Suchergebnisse heißen `anilist-<Zahl>`; beide sind erlaubt.

## Zugriffsregeln (RLS)

| Aktion  | Wer                            | Regel                                                                                        |
| ------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| Lesen   | alle (`anon`, `authenticated`) | Beiträge sind öffentlich wie Profile und die Community-Seite                                 |
| Anlegen | `authenticated`                | Nur mit `author_id = auth.uid()`; Spalten `body`, `category`, `anime_id`, `contains_spoiler` |
| Ändern  | `authenticated`                | Nur eigene Beiträge (`auth.uid() = author_id`) und nur `body` und `contains_spoiler`         |
| Löschen | `authenticated`                | Nur eigene Beiträge; endgültig, Kommentare werden später per `on delete cascade` mitgelöscht |

`author_id`, `id` und die Zeitstempel kann ein Nutzer weder beim Anlegen noch beim Ändern setzen. Das erzwingen Spaltenrechte (`grant insert (…)`, `grant update (…)`), nicht nur die Oberfläche. `author_id` füllt die Datenbank über den Standardwert `auth.uid()`; die Policy prüft ihn zusätzlich.

## Abläufe

**Feed laden:** Beim Start lädt die App die neuesten 50 Beiträge mit Autorprofil in einer Abfrage (`select …, author:profiles(…)`), registriert die Profile in `users.ts` und hält die Beiträge in einem kleinen Client-Store für `usePosts()`. Fehlt die Tabelle noch (Migration nicht angewendet) oder ist Supabase nicht konfiguriert, bleibt die Liste leer und die App zeigt wie bisher nur Demo-Beiträge. Neue Beiträge von Supabase-Konten landen dann wie bisher im Demo-Store.

**Beitrag erstellen:** Bei einem Supabase-Konto schreibt der Composer per `insert … select` in `posts` und fügt die zurückgegebene Zeile in die Liste ein. Bei einem Demo-Konto bleibt alles wie bisher im lokalen Store. Datenbankfehler zeigt die Oberfläche mit einer verständlichen Meldung (`postErrorMessage`, z. B. „Der Beitrag entspricht nicht den Regeln …“); der Text bleibt im Eingabefeld erhalten.

**Bearbeiten und Löschen:** Der Bearbeiten-Dialog und „Löschen“ in der Post-Karte rufen bei echten Beiträgen `update` bzw. `delete` auf und aktualisieren danach die Liste. Liefert die Datenbank keine Zeile zurück (fremder Beitrag, RLS greift), meldet die Oberfläche einen Fehler statt stillschweigend lokal zu ändern.

**Detailseite `/community/posts/[postId]`:** Ist die ID eine UUID und nicht in der Liste, lädt die Seite den einzelnen Beitrag nach. So funktionieren geteilte Links auch für ältere Beiträge.

**Profilseite `/u/[username]`:** Kennt die App den Namen nicht, lädt sie das Profil aus `profiles` nach (Groß/klein egal). Gezeigt werden die echten Beiträge dieser Person aus den 50 neuesten.

**Unterscheidung echt/Demo:** Echte Beiträge haben UUIDs, Demo-Beiträge IDs wie `p-…`. `Post` hat ein optionales Feld `source` (`"supabase"` bei echten Beiträgen, fehlt bei Demo-Beiträgen), damit Karten und Aktionen nicht an der ID-Form hängen. Alle übrigen Beiträge zeigen ein „Demo“-Abzeichen.

## Akzeptanzkriterien

- [x] Migration legt Tabelle, Constraints, Indizes, RLS-Regeln, Spaltenrechte und den `edited_at`-Trigger an und droppt nichts. (Inhalt per Test und Review geprüft; angewendet, `migration list` zeigt sie lokal und in der Cloud.)
- [x] Ein nicht angemeldeter Besucher sieht echte Beiträge, kann aber keine anlegen. (Live: Lesen 200; Anlegen, Ändern und Löschen ohne Anmeldung mit 401/`42501` abgelehnt.)
- [x] Ein angemeldeter Nutzer kann Beiträge anlegen, nur eigene bearbeiten und löschen. (Live mit zwei Konten über die Oberfläche geprüft.)
- [ ] Kein Beitrag im Namen eines anderen und keine Änderung fremder Beiträge über die API. (Abgesichert durch RLS und Spaltenrechte, aber noch nicht mit einer angemeldeten Sitzung direkt gegen die Datenbank getestet.)
- [ ] Die Datenbank lehnt ab: Text mit 2 oder 1001 Zeichen, unbekannte Kategorie, `anime_id` in falschem Format, Änderung von `author_id` oder `created_at`. (Constraints und Spaltenrechte stehen in der Migration, ein Test hält die Grenzen gleich; gegen die Live-Datenbank noch nicht geprüft.)
- [x] Ein Beitrag aus Browser A erscheint nach Neuladen in Browser B (anderes Konto, auch abgemeldet) mit richtigem Autor.
- [x] Bearbeitete Beiträge zeigen „bearbeitet“ über `edited_at`.
- [x] Der Demo-Modus funktioniert unverändert; ohne angewendete Migration läuft die App wie bisher. (Lokal und live vor dem Anwenden geprüft: Rückfall auf Demo-Beiträge, Demo-Beitrag erstellen und löschen.)
- [x] `npm run test`, `npm run lint`, `npm run typecheck` und `npm run build` sind lokal grün. `format:check` meldet lokal nur CRLF-Zeilenenden (Windows, `core.autocrlf=true`); mit `--end-of-line auto` ist alles formatiert. Die CI auf Linux betrifft das nicht.
- [x] Tests decken ab: Eingabeprüfung (Grenzen, Leerraum, Emojis, Kategorie, Anime-ID), Zeile ↔ `Post` (mit und ohne Anime, bearbeitet, Spoiler, unbekannte Kategorie), Fehlermeldungen und dieselben Grenzen in Migration und Formular.

## Manuelle RLS-Prüfung nach dem Anwenden

Mit zwei Testkonten A und B auf der Preview-Umgebung:

1. A erstellt einen Beitrag → erscheint bei B und abgemeldet.
2. B öffnet A's Beitrag: kein „Bearbeiten“/„Löschen“. Ein direkter `update`/`delete` aus der Browser-Konsole mit B's Sitzung ändert 0 Zeilen.
3. A bearbeitet und löscht seinen Beitrag → bei B nach Neuladen geändert bzw. weg.
4. Im SQL-Editor: `select * from pg_policies where tablename = 'posts';` zeigt genau die vier Regeln.

**Ergebnis am 17.11.2026 (live):** Schritte 1 und 3 sowie der Oberflächenteil von Schritt 2 erfolgreich mit zwei Konten. Ohne Anmeldung lehnt die Datenbank Anlegen, Ändern und Löschen ab (401/`42501`); dabei wurden keine Daten geschrieben. Noch offen: der direkte Konsolenversuch aus Schritt 2 und Schritt 4.

Bekannte Lücke bis zum Moderations-Schritt: Gesperrte Konten hält nur die Oberfläche auf, nicht die Datenbank.

## Anwenden in der Cloud

Die Migration wird nicht automatisch angewendet, sondern erst nach Review und deinem OK. `supabase:link:dev` zeigt inzwischen auf `pkjhfyjyoygmoyqmmwng`, dasselbe Projekt wie App, `.env.local` und Live-Seite (vorher stand dort fälschlich `ybtcgpqartsuelpllbzt`). Weil es kein getrenntes Entwicklungsprojekt gibt, wirkt `db push` direkt auf die Live-Seite. Ablauf: `npm.cmd run supabase:link:dev`, verknüpftes Projekt prüfen, `npx.cmd supabase migration list` (lesend), SQL prüfen, `npx.cmd supabase db push`.

## Entscheidungen (bestätigt am 17.11.2026)

1. **Demo- und echte Beiträge gemischt:** ja, solange es wenige echte Beiträge gibt, damit der Feed nicht leer wirkt. Demo-Beiträge bekommen ein kleines „Demo“-Abzeichen, damit klar ist, was echt ist.
2. **Endgültig löschen:** ja, wenn der Autor löscht. Für die Moderation kommt später eine eigene Spalte `removed_at` mit Protokoll.
3. **Gesperrte Konten:** Sperren liegen noch im Demo-Store, die Datenbank kennt sie nicht. Bis zum Moderations-Schritt prüft nur die Oberfläche (wie bisher); das ist als bekannte Lücke dokumentiert.
4. **Schutz vor Spam (Rate Limit):** noch nicht in diesem Schritt; später serverseitig zusammen mit der Moderation.
5. **Profilseiten anderer echter Nutzer:** `/u/[username]` lädt ein einzelnes Profil nach Nutzernamen nach, damit Autorlinks nicht ins Leere führen.
