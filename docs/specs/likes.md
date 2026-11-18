# Spezifikation: Likes und gespeicherte Beiträge (Schritt 5)

Status: umgesetzt, Migration noch nicht in der Cloud angewendet · Branch: `feat/likes-table`

## Ziel

Likes auf echte Beiträge und Kommentare liegen in der Datenbank. Alle sehen dieselben Like-Zahlen, und jedes Konto sieht seine eigenen Likes auf jedem Gerät. Optional wandert auch „Speichern“ (Lesezeichen) in die Datenbank. Aufbau und Muster folgen [posts.md](posts.md) und [comments.md](comments.md).

## Ausgangslage

- Likes und Lesezeichen liegen im Demo-Store (`likedPostIds`, `likedCommentIds`, `savedPostIds` in `src/features/demo/store.ts`) und damit nur im jeweiligen Browser bzw. Tab. Live bestätigt: Ein Like von Konto A ist für Konto B in einem anderen Tab nicht sichtbar.
- Diese Listen hängen **nicht am Konto**: Anders als Favoriten und Gefolgte (`UserLists`) gelten sie für alle Konten im selben Browser. Wer das Konto wechselt, sieht die Likes des vorherigen Kontos als eigene.
- Angezeigt wird `likeCount = baseLikeCount + (liked ? 1 : 0)`. `baseLikeCount` sind feste Zahlen aus den Demo-Daten; echte Beiträge und Kommentare haben `0`.
- Like-Zahlen steuern die Sortierung „Beliebt“ im Feed, „Meiste Likes“ bei Kommentaren, die Top-Kommentare einer Episode und die Seitenleiste „Beliebte Beiträge“.
- „Speichern“ hat keine eigene Ansicht; das Lesezeichen ist nur für die Person selbst sichtbar.
- Echte Beiträge und Kommentare haben UUIDs, Demo-Inhalte IDs wie `p-…` und `c-…`.

## Umfang

1. **Migration** `supabase/migrations/20261118160000_create_likes.sql` mit den Tabellen `post_likes`, `comment_likes` und (Entscheidung 3) `post_saves`, RLS, Spaltenrechten und Zählfunktionen. Legt nur an, löscht nichts.
2. **Umwandlung und Fehler** in `src/features/community/like-row.ts`, ohne Supabase-Client und testbar.
3. **Datenzugriff** in `src/features/community/likes-supabase.ts`: Zahlen und eigene Likes für geladene Beiträge und Kommentare laden, Like setzen und entfernen, Lesezeichen setzen und entfernen.
4. **Weiche** in `src/features/community/like-actions.ts`: Supabase-Konto und echter Inhalt → Datenbank, sonst Demo-Store.
5. **Oberfläche**: Like- und Speichern-Knöpfe reagieren sofort (optimistisch) und nehmen die Änderung zurück, wenn die Datenbank ablehnt. `usePosts`, `useAllComments` und die Sortierungen nutzen die echten Zahlen.
6. **Demo-Store je Konto** (Entscheidung 4): `likedPostIds`, `likedCommentIds` und `savedPostIds` wandern in die Listen je Konto.
7. **Tests** (Vitest) für Umwandlung, Zuordnung echt/Demo, Zahlenberechnung und Migration.
8. **Doku**: `docs/SUPABASE.md`, `docs/DEMO.md`, README („Stand“, „Nächste Schritte“).

## Nicht im Umfang

- Likes und Lesezeichen auf Demo-Inhalte (`p-…`, `c-…`): Diese Inhalte liegen nicht in der Datenbank, ein Fremdschlüssel ist nicht möglich. Solche Likes bleiben im Demo-Store, auch bei Supabase-Konten.
- Eine Liste „Wer hat geliked?“, Benachrichtigungen, eine Ansicht „Gespeicherte Beiträge“.
- Echtzeit-Updates: Zahlen anderer Nutzer erscheinen nach Neuladen.
- Schutz vor automatisiertem Massen-Liken (Rate Limit), wie bei Beiträgen auf später verschoben.

## Datenmodell

**`public.post_likes`** und **`public.comment_likes`** (gleicher Aufbau):

| Spalte                   | Typ           | Regeln                                                                           |
| ------------------------ | ------------- | -------------------------------------------------------------------------------- |
| `post_id` / `comment_id` | `uuid`        | Pflicht, verweist auf `posts(id)` bzw. `comments(id)`, `on delete cascade`       |
| `user_id`                | `uuid`        | Pflicht, Standard `auth.uid()`, verweist auf `profiles(id)`, `on delete cascade` |
| `created_at`             | `timestamptz` | Standard `now()`                                                                 |

Primärschlüssel `(post_id, user_id)` bzw. `(comment_id, user_id)`: Jedes Konto kann einen Inhalt höchstens einmal liken; ein zweiter Like schlägt mit `23505` fehl und wird von der App wie „schon geliked“ behandelt. Index auf `user_id` für „meine Likes“.

**`public.post_saves`** (Entscheidung 3): gleicher Aufbau wie `post_likes`.

Eigene Tabellen statt einer gemeinsamen `likes`-Tabelle mit zwei optionalen Spalten: So gibt es echte Fremdschlüssel, einfache Primärschlüssel und keinen Check „genau ein Ziel“.

**Funktionen:**

- `post_like_counts(post_ids uuid[])` → `post_id`, `like_count`
- `comment_like_counts(comment_ids uuid[])` → `comment_id`, `like_count`

Sie liefern nur Zahlen, keine Namen. Weil Likes anderer nicht lesbar sind (siehe RLS), laufen sie als `security definer` mit festem `search_path`.

## Zugriffsregeln (RLS)

| Tabelle         | Lesen                  | Anlegen                                     | Löschen    | Ändern  |
| --------------- | ---------------------- | ------------------------------------------- | ---------- | ------- |
| `post_likes`    | nur eigene (Entsch. 2) | `authenticated`, nur `user_id = auth.uid()` | nur eigene | niemand |
| `comment_likes` | nur eigene (Entsch. 2) | wie oben                                    | nur eigene | niemand |
| `post_saves`    | nur eigene             | wie oben                                    | nur eigene | niemand |

`user_id` und `created_at` setzt nur die Datenbank (Spaltenrechte: Anlegen nur mit `post_id` bzw. `comment_id`). Ohne Anmeldung lassen sich nur die Zahlen über die Funktionen abfragen.

## Abläufe

**Zahlen laden:** Nach dem Laden der Beiträge holt die App `post_like_counts` (zusammen mit den Kommentarzahlen), nach dem Laden eines Threads `comment_like_counts`. Ist jemand angemeldet, lädt sie zusätzlich die eigenen Likes und Lesezeichen für dieselben IDs. Fehlen Tabellen oder Funktionen, bleibt alles wie bisher im Demo-Store.

**Liken, Like entfernen, Speichern:** Der Knopf ändert Zustand und Zahl sofort. Bei einem Supabase-Konto und einem echten Inhalt schreibt die App in die Datenbank; lehnt sie ab, wird die Änderung zurückgenommen und eine kurze Meldung gezeigt. Demo-Konten und Demo-Inhalte bleiben im Demo-Store.

**Anzeige:** Für echte Inhalte gilt `likeCount` = Zahl aus der Datenbank; `liked` = eigener Like vorhanden. Für Demo-Inhalte bleibt es bei `baseLikeCount + eigener lokaler Like`.

**Konto wechseln:** Likes und Lesezeichen gehören zum angemeldeten Konto: in der Datenbank ohnehin, im Demo-Store durch die Umstellung auf Listen je Konto. Beim Abmelden verschwinden die eigenen Markierungen, die Zahlen bleiben.

## Akzeptanzkriterien

- [ ] Migration legt Tabellen, Primärschlüssel, Fremdschlüssel, RLS-Regeln, Spaltenrechte und Zählfunktionen an und droppt nichts.
- [ ] Ohne Anmeldung: Zahlen sichtbar, aber Liken und Speichern nicht möglich; einzelne Likes anderer nicht abrufbar.
- [ ] Konto A liked einen echten Beitrag und einen echten Kommentar → Konto B sieht nach Neuladen die höhere Zahl, aber nicht als eigenen Like markiert.
- [ ] Konto A sieht seine Likes und Lesezeichen auch in einem anderen Browser bzw. inkognito.
- [ ] Doppeltes Liken erzeugt keinen zweiten Eintrag; Like entfernen senkt die Zahl.
- [ ] Wird ein Beitrag oder Kommentar gelöscht, verschwinden seine Likes und Lesezeichen mit.
- [ ] Im selben Browser sieht ein anderes Konto nicht die lokalen Likes des vorherigen Kontos.
- [ ] Sortierungen („Beliebt“, „Meiste Likes“, Top-Kommentare) nutzen die echten Zahlen.
- [ ] Der Demo-Modus funktioniert; ohne angewendete Migration läuft die App wie bisher.
- [x] `npm run test`, `npm run lint`, `npm run typecheck` und `npm run build` sind lokal grün.
- [x] Tests decken ab: Zahlen je ID, Anzeige (Demo-Inhalt, echter Inhalt, fremder Like), doppelte Likes, Fehlermeldungen und die Regeln der Migration.

## Manuelle RLS-Prüfung nach dem Anwenden

Mit zwei registrierten Konten A und B auf der Live-Seite (z. B. normaler Tab und inkognito):

1. A liked einen echten Beitrag und einen echten Kommentar → B sieht nach Neuladen die höhere Zahl, aber nicht als eigenen Like.
2. A sieht seine Likes und Lesezeichen auch in einem anderen Tab nach Anmeldung.
3. A entfernt den Like → die Zahl sinkt bei beiden.
4. Abgemeldet: Zahlen sichtbar, Knöpfe fragen nach Anmeldung.
5. Im selben Tab erst Demo-Konto liken, dann mit A anmelden → A sieht die Demo-Likes nicht als eigene.

## Anwenden in der Cloud

Wie bei `posts` und `comments`: erst nach Review und deinem OK, `db push` wirkt direkt auf die Live-Seite. Ablauf: `npx.cmd supabase migration list`, `npx.cmd supabase db push --dry-run`, `npx.cmd supabase db push`. Hinweis: Ab der nächsten Hauptversion der Supabase-CLI zielen diese Befehle ohne `--linked` auf die lokale Datenbank.

## Entscheidungen (bestätigt am 18.11.2026)

1. **Zwei Tabellen (`post_likes`, `comment_likes`) statt einer `likes`-Tabelle:** ja, wegen echter Fremdschlüssel und einfacher Primärschlüssel. Die README nennt bisher `likes`; sie wird angepasst.
2. **Wer darf einzelne Likes lesen:** nur die eigenen. Andere sehen nur Zahlen über die Zählfunktionen. Es gibt keine Ansicht „Wer hat geliked?“, und so verrät die Datenbank nicht, wer was mag.
3. **„Speichern“ gleich mit umstellen (`post_saves`, nur privat lesbar):** ja. Gleicher Aufwand, gleicher Knopfbereich, und das Lesezeichen soll auf allen Geräten da sein.
4. **Demo-Store-Likes je Konto:** ja. Heute sieht ein anderes Konto im selben Browser die Likes des vorherigen als eigene; das passt nicht dazu, dass echte Likes am Konto hängen.
5. **Optimistische Anzeige:** ja, der Knopf reagiert sofort und wird bei einem Fehler zurückgesetzt. Ein Like soll sich nicht träge anfühlen.
