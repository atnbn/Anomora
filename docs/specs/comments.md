# Spezifikation: Kommentare als zweite Community-Tabelle (Schritt 4)

Status: umgesetzt, Migration noch nicht in der Cloud angewendet · Branch: `feat/comments-table`

## Ziel

Kommentare und Antworten von Supabase-Konten liegen dauerhaft in einer Tabelle `public.comments` statt im Browser – sowohl unter echten Beiträgen als auch in Episodendiskussionen. Alle Besucher sehen dieselben echten Kommentare, und die Datenbank stellt per Row Level Security (RLS) sicher, dass nur der Autor seinen Kommentar löschen kann. Aufbau und Muster folgen [posts.md](posts.md).

## Ausgangslage

- Kommentare entstehen im Demo-Store (`demoActions.createComment`, `deleteComment` in `src/features/demo/store.ts`) und liegen in `localStorage`. Alle Konten im selben Browser sehen sie, andere Browser nicht (live bestätigt).
- `Comment.target` ist entweder `{ type: "post", postId }` oder `{ type: "episode", episodeId }`. `parentId` erlaubt genau eine Antwortebene: Antworten auf Antworten hängen sich an den ursprünglichen Kommentar (`comment-thread.tsx`).
- Episoden-IDs haben die Form `${slug}-${nummer}`. Bei AniList-Anime enthält der Slug den Titel (`21-one-piece-1155`); ändert sich der Titel, ändert sich die ID.
- Regeln stehen nur im Formular: 2–600 Zeichen (`MAX_COMMENT_LENGTH` in `comment-thread.tsx`).
- Kommentarzahlen zeigen Feed (`commentCount` je Beitrag), Episodenliste und Dashboard (`useEpisodeCommentCounts`).
- Löschen: Der Dialog verspricht „Antworten anderer bleiben sichtbar“, `useComments` baut Threads aber nur aus Wurzelkommentaren – Antworten auf einen gelöschten Kommentar verschwinden heute schon.
- `public.posts` existiert mit RLS; Demo-Beiträge (`p-…`) liegen nicht in der Datenbank.

## Umfang

1. **Migration** `supabase/migrations/20261118120000_create_comments.sql`: Tabelle, Constraints, Indizes, Trigger für gültige Antworten, RLS, Spaltenrechte und die Funktionen `post_comment_counts` und `episode_comment_counts`. Legt nur an, löscht nichts.
2. **Eingabeprüfung** in `src/lib/validation/comments.ts` (Länge), genutzt vom Kommentarformular.
3. **Umwandlung** Zeile ↔ `Comment` in `src/features/community/comment-row.ts`, ohne Supabase-Client und damit testbar.
4. **Datenzugriff** in `src/features/community/comments-supabase.ts`: Kommentare je Ziel laden (mit Autorprofil), anlegen, löschen, Zahlen laden. `src/features/community/comment-actions.ts` entscheidet wie `post-actions.ts` zwischen Tabelle und Demo-Store.
5. **Kommentarzahlen**: je echtem Beitrag über `post_comment_counts`, je Episode über `episode_comment_counts`. Bewusst nicht als eingebettetes `comments(count)` in der Beitragsabfrage: Fehlt die Tabelle, würde sonst die ganze Beitragsabfrage scheitern.
6. **Oberfläche**: `useComments`, `useEpisodeCommentCounts` und die Kommentarzahlen im Feed nehmen echte Kommentare auf; der Löschdialog nennt die Antworten. Demo-Kommentare bekommen wie Demo-Beiträge ein „Demo“-Abzeichen, unter Demo-Beiträgen erscheint für Supabase-Konten ein Hinweis.
7. **Tests** (Vitest) für Eingabeprüfung, Umwandlung, Episodenbezug und gleiche Grenzen in Migration und Formular.
8. **Doku**: `docs/SUPABASE.md`, `docs/DEMO.md`, README („Stand“, „Nächste Schritte“).

## Nicht im Umfang

- Likes auf Kommentare (eigene Tabelle `likes`), Melden und Moderation in der Datenbank. Sie bleiben im Demo-Store und funktionieren über die Kommentar-ID auch für echte Kommentare, aber nur lokal.
- Kommentare bearbeiten: Die Oberfläche bietet das heute nicht an; es gibt deshalb keine Update-Regel.
- Kommentare unter Demo-Beiträgen (`p-…`): Diese Beiträge stehen nicht in der Tabelle `posts`, ein Fremdschlüssel ist nicht möglich. Solche Kommentare bleiben im Demo-Store, auch bei Supabase-Konten.
- Mehr als eine Antwortebene, Echtzeit-Updates, Seitenweises Nachladen über 200 Kommentare je Ziel.
- Datenbanktests mit pgTAP; RLS wird wie bei `posts` manuell nach der Checkliste geprüft.

## Datenmodell `public.comments`

| Spalte             | Typ           | Regeln                                                                             |
| ------------------ | ------------- | ---------------------------------------------------------------------------------- |
| `id`               | `uuid`        | Primärschlüssel, Standard `gen_random_uuid()`                                      |
| `author_id`        | `uuid`        | Pflicht, Standard `auth.uid()`, verweist auf `profiles(id)`, `on delete cascade`   |
| `post_id`          | `uuid`        | Ziel Beitrag: verweist auf `posts(id)`, `on delete cascade`                        |
| `anime_id`         | `text`        | Ziel Episode: Format wie `posts.anime_id` (`a-…` oder `anilist-<Zahl>`)            |
| `episode_number`   | `integer`     | Ziel Episode: 1–10000                                                              |
| `parent_id`        | `uuid`        | optional, verweist auf `comments(id)`; Verhalten beim Löschen siehe Entscheidung 2 |
| `body`             | `text`        | Pflicht, ohne Leerraum am Anfang/Ende, 2–600 Zeichen                               |
| `contains_spoiler` | `boolean`     | Pflicht, Standard `false`                                                          |
| `created_at`       | `timestamptz` | Standard `now()`                                                                   |

Genau ein Ziel ist gesetzt: entweder `post_id` oder `anime_id` + `episode_number` (Check-Constraint). Episoden werden über Anime-ID und Folgennummer gespeichert, nicht über die Episoden-ID der App, weil diese bei AniList den Titel enthält. Die App rechnet beim Laden und Speichern um (`getEpisodeByIdSync` liefert `animeId` und `number`).

Ein Trigger prüft Antworten: Der Elternkommentar muss ein Wurzelkommentar sein (`parent_id is null`) und dasselbe Ziel haben. So bleibt es bei einer Antwortebene, auch wenn jemand die Oberfläche umgeht.

Indizes: `(post_id, created_at)` und `(anime_id, episode_number, created_at)` für Threads, `(parent_id)` für Antworten, `(author_id)` für spätere Profilansichten.

**Funktionen `post_comment_counts(post_ids uuid[])` und `episode_comment_counts(anime_ids text[])`:** liefern die Zahl der Kommentare je Beitrag bzw. je Anime und Folge. Lesbar für alle, `security invoker`, damit RLS gilt.

## Zugriffsregeln (RLS)

| Aktion  | Wer                            | Regel                                                                                                                      |
| ------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Lesen   | alle (`anon`, `authenticated`) | Kommentare sind öffentlich wie Beiträge                                                                                    |
| Anlegen | `authenticated`                | Nur mit `author_id = auth.uid()`; Spalten `post_id`, `anime_id`, `episode_number`, `parent_id`, `body`, `contains_spoiler` |
| Ändern  | niemand                        | Keine Update-Regel und keine Update-Rechte                                                                                 |
| Löschen | `authenticated`                | Nur eigene Kommentare                                                                                                      |

`author_id`, `id` und `created_at` kann niemand setzen (Spaltenrechte). Kommentare zu gelöschten Beiträgen verschwinden per `on delete cascade` mit dem Beitrag.

## Abläufe

**Thread laden:** Öffnet jemand einen echten Beitrag oder eine Episodendiskussion, lädt die App die Kommentare dieses Ziels (bis 200, älteste zuerst) mit Autorprofil, registriert die Profile in `users.ts` und hält sie je Ziel in einem kleinen Client-Store. `useComments` mischt sie mit Demo-Kommentaren. Fehlt die Tabelle, bleibt es wie bisher beim Demo-Store.

**Kommentieren und antworten:** Supabase-Konten schreiben in die Tabelle, wenn das Ziel in der Datenbank liegt (echter Beitrag oder Episode). Demo-Konten und Kommentare unter Demo-Beiträgen bleiben im Demo-Store. Fehler zeigt das Formular mit verständlicher Meldung; der Text bleibt erhalten.

**Löschen:** Nur eigene Kommentare, endgültig. Verhalten der Antworten siehe Entscheidung 2. Liefert die Datenbank keine Zeile zurück, meldet die Oberfläche einen Fehler.

**Kommentarzahlen:** Nach dem Laden der Beiträge holt die App `post_comment_counts`; Episodenliste und Dashboard laden `episode_comment_counts` für die angezeigten Anime. Demo-Kommentare werden wie bisher lokal dazugezählt. Nach eigenem Kommentieren oder Löschen passt die App die Zahl direkt an.

## Akzeptanzkriterien

- [ ] Migration legt Tabelle, Constraints, Indizes, Antwort-Trigger, RLS-Regeln, Spaltenrechte und die beiden Zählfunktionen an und droppt nichts.
- [ ] Ein nicht angemeldeter Besucher sieht echte Kommentare, kann aber keine anlegen oder löschen.
- [ ] Ein angemeldeter Nutzer kann unter echten Beiträgen und in Episodendiskussionen kommentieren und antworten und nur eigene Kommentare löschen.
- [ ] Die Datenbank lehnt ab: 1 oder 601 Zeichen, kein oder zwei Ziele, Antwort auf eine Antwort, Antwort mit anderem Ziel als der Elternkommentar.
- [ ] Ein Kommentar aus Browser A erscheint nach Neuladen in Browser B (anderes Konto, auch abgemeldet) mit richtigem Autor.
- [ ] Kommentarzahlen in Feed, Episodenliste und Dashboard enthalten echte Kommentare.
- [ ] Wird ein echter Beitrag gelöscht, verschwinden seine Kommentare mit.
- [ ] Der Demo-Modus funktioniert unverändert; ohne angewendete Migration läuft die App wie bisher.
- [x] `npm run test`, `npm run lint`, `npm run typecheck` und `npm run build` sind lokal grün.
- [x] Tests decken ab: Eingabeprüfung (Grenzen, Emojis, Folgennummer), Ziel-Zuordnung (echter Beitrag, Demo-Beitrag, Episode, unbekannte Episode), Zeile ↔ Kommentar, Fehlermeldungen und dieselben Grenzen in Migration und Formular.

## Manuelle RLS-Prüfung nach dem Anwenden

Mit zwei Testkonten A und B auf der Live-Seite (es gibt nur ein Projekt):

1. A kommentiert einen echten Beitrag und eine Episode → erscheint bei B und abgemeldet, Kommentarzahl in Feed bzw. Episodenliste stimmt.
2. B antwortet auf A's Kommentar → erscheint bei A eingerückt.
3. B sieht bei A's Kommentar kein „Löschen“, nur „Melden“.
4. A löscht seinen Kommentar → er und B's Antwort sind nach Neuladen bei allen weg, die Zahl sinkt.
5. Unter einem Demo-Beitrag sieht A den Hinweis „Demo-Beitrag – dein Kommentar bleibt in diesem Browser“.

## Anwenden in der Cloud

Wie bei `posts`: erst nach Review und deinem OK. Es gibt nur ein Supabase-Projekt (`pkjhfyjyoygmoyqmmwng`), `db push` wirkt also direkt auf die Live-Seite. Ablauf: `npx.cmd supabase migration list` (lesend), `npx.cmd supabase db push --dry-run`, dann `npx.cmd supabase db push`.

## Entscheidungen (bestätigt am 18.11.2026)

1. **Episodendiskussionen gleich mit umstellen:** ja. Sie nutzen dieselbe Komponente, und gerade dort sollen sich verschiedene Nutzer austauschen.
2. **Antworten beim Löschen:** werden mitgelöscht (`on delete cascade`), und der Dialog sagt das („Der Kommentar und seine Antworten werden entfernt.“). Das entspricht dem, was die Oberfläche schon vorher zeigte.
3. **Episoden über `anime_id` + `episode_number`:** ja, weil die Episoden-ID bei AniList-Anime den Titel enthält und sich ändern kann.
4. **„Demo“-Abzeichen an Demo-Kommentaren:** ja, wie bei Beiträgen.
5. **Kommentare unter Demo-Beiträgen bei Supabase-Konten:** bleiben lokal; das Formular zeigt dort „Demo-Beitrag – dein Kommentar bleibt in diesem Browser“.
