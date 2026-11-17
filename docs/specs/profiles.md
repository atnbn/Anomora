# Spezifikation: Profiltabelle mit RLS und erste Tests (Schritt 2)

Status: umgesetzt, Migration noch nicht in der Cloud angewendet · Branch: `feat/profiles-table`

## Ziel

Profilangaben von Supabase-Konten liegen dauerhaft in einer Tabelle `public.profiles` statt in den Nutzer-Metadaten. Dadurch ist der Nutzername projektweit eindeutig, und die Datenbank schützt die Daten mit Row Level Security (RLS). Gleichzeitig bekommt das Projekt ein Testframework und erste automatisierte Tests, die auch in der CI laufen.

## Ausgangslage

- Profilangaben (`username`, `display_name`, `bio`, `avatar_hue`, `onboarding_complete`) stehen in `user_metadata` (siehe `src/features/auth/supabase-auth.ts`).
- Die Prüfung „Nutzername vergeben“ (`isUsernameTaken` in `src/lib/data/users.ts`) kennt nur Demo- und lokale Profile, nicht die echten Supabase-Konten.
- Es gibt weder Tabellen noch Migrationen noch Tests. `tests/` ist leer.

## Umfang

1. **Migration** `supabase/migrations/<zeitstempel>_create_profiles.sql` mit Tabelle, Constraints, RLS-Regeln, Triggern, Funktion `username_available` und Übernahme bestehender Konten.
2. **Datenzugriff** für Supabase-Konten: Profil lesen, speichern und Onboarding abschließen über die Tabelle. Der Demo-Modus bleibt unverändert.
3. **Nutzername prüfen** bei Registrierung und Profiländerung zusätzlich gegen die Datenbank.
4. **Testframework** Vitest mit Skript `npm run test`, eingebunden in `npm run check` und damit in die CI.
5. **Erste Tests** für reine Funktionen: Eingabeprüfung, AniList-Mapping und die Umwandlung Tabellenzeile ↔ Konto.
6. **Doku**: `docs/SUPABASE.md` und `docs/PROJEKTSTRUKTUR.md` auf den neuen Stand bringen.

## Nicht im Umfang

- Avatar-Upload (Supabase Storage), Konto löschen
- Favoriten, Beiträge, Kommentare, Follower und Moderation in der Datenbank (bleiben im Demo-Store)
- Datenbanktests für RLS mit pgTAP (brauchen den lokalen Supabase-Stack mit Docker), Oberflächen- und End-to-End-Tests
- Oberfläche zur Rollenvergabe (Moderator)

## Datenmodell `public.profiles`

| Spalte                | Typ           | Regeln                                                                |
| --------------------- | ------------- | --------------------------------------------------------------------- |
| `id`                  | `uuid`        | Primärschlüssel, verweist auf `auth.users(id)`, `on delete cascade`   |
| `username`            | `text`        | Pflicht, 3–24 Zeichen, nur `A–Z a–z 0–9 _`, eindeutig ohne Groß/klein |
| `display_name`        | `text`        | Pflicht, 1–40 Zeichen nach Trimmen                                    |
| `bio`                 | `text`        | optional, höchstens 160 Zeichen                                       |
| `avatar_hue`          | `smallint`    | Pflicht, 0–360                                                        |
| `onboarding_complete` | `boolean`     | Pflicht, Standard `false`                                             |
| `role`                | `text`        | `member` oder `moderator`, Standard `member`                          |
| `created_at`          | `timestamptz` | Standard `now()`                                                      |
| `updated_at`          | `timestamptz` | Standard `now()`, wird per Trigger bei jeder Änderung gesetzt         |

Die Grenzen entsprechen `src/lib/validation/auth.ts`. Die Datenbank prüft sie zusätzlich, weil die Prüfung im Browser umgangen werden kann. Die E-Mail-Adresse steht bewusst nicht in der Tabelle.

## Zugriffsregeln (RLS)

| Aktion  | Wer                            | Regel                                                                                                                                |
| ------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Lesen   | alle (`anon`, `authenticated`) | Profile sind öffentlich, damit Community- und Profilseiten sie anzeigen können                                                       |
| Anlegen | niemand über die API           | Nur der Trigger bei der Registrierung legt Profile an                                                                                |
| Ändern  | `authenticated`                | Nur das eigene Profil (`auth.uid() = id`) und nur die Spalten `username`, `display_name`, `bio`, `avatar_hue`, `onboarding_complete` |
| Löschen | niemand über die API           | Profil verschwindet automatisch mit dem Konto                                                                                        |

`role`, `id` und die Zeitstempel kann ein Nutzer nicht ändern. Das wird über Spaltenrechte (`grant update (…)`) erzwungen, nicht nur über die Oberfläche.

## Abläufe

**Registrierung:** Die App prüft den Nutzernamen über `username_available`. Danach ruft sie wie bisher `signUp` mit den Metadaten auf. Ein Trigger auf `auth.users` legt die Profilzeile aus den Metadaten an. Ist der Name ungültig oder inzwischen vergeben (gleichzeitige Registrierung), erhält das Profil den Ersatznamen `user_` plus die ersten 8 Zeichen der ID. Die Registrierung scheitert dadurch nie an der Profiltabelle, und der Name lässt sich im Onboarding ändern.

**Anmelden und Sitzung:** Nach `onAuthStateChange` lädt die App die Profilzeile und baut daraus das Konto für die Oberfläche. Fehlt die Zeile oder ist die Tabelle noch nicht angelegt, nutzt sie wie bisher die Metadaten. So läuft die App auch, bevor die Migration in der Cloud angewendet ist.

**Profil ändern und Onboarding:** `saveProfile` und `finishOnboarding` schreiben bei Supabase-Konten per `update` in `profiles`. Meldet die Datenbank einen doppelten Nutzernamen (Fehlercode `23505`), zeigt die Oberfläche „Dieser Nutzername ist schon vergeben.“

**Bestehende Konten:** Die Migration übernimmt bereits registrierte Nutzer einmalig aus `auth.users` in `profiles`.

## Akzeptanzkriterien

- [ ] Migration legt Tabelle, Constraints, eindeutigen Index auf `lower(username)`, RLS-Regeln, Spaltenrechte, Trigger und `username_available` an.
- [ ] Ein angemeldeter Nutzer kann nur sein eigenes Profil ändern und seine Rolle nicht setzen.
- [ ] Ungültige Werte (z. B. Nutzername mit Leerzeichen, Bio mit 161 Zeichen) lehnt die Datenbank ab.
- [ ] Zwei Konten können nicht `Kenji` und `kenji` heißen.
- [ ] Registrierung, Onboarding und Profileinstellungen funktionieren mit Supabase-Konten über die Tabelle; der Demo-Modus funktioniert unverändert.
- [ ] Ohne angewendete Migration funktioniert die App weiter über die Metadaten.
- [ ] `npm run test` läuft lokal und in der CI; `npm run check` und `npm run build` bleiben grün.
- [ ] Tests decken ab: Nutzername, E-Mail, Passwort, Bio, `safeRedirect`, AniList-Mapping und Zeile ↔ Konto.

## Anwenden in der Cloud

Die Migration wird nicht automatisch angewendet. Nach dem Review: `npm.cmd run supabase:login`, `npm.cmd run supabase:link:dev`, SQL prüfen, dann `npx.cmd supabase db push`. Das Datenbankpasswort wird nur im eigenen Terminal eingegeben.

## Offene Entscheidungen

1. Sollen Profile auch für nicht angemeldete Besucher lesbar sein? Vorschlag: ja, wie bei den öffentlichen Profilseiten.
2. Ersatzname bei Namenskonflikt statt Fehler bei der Registrierung? Vorschlag: ja, wie oben beschrieben.
3. Vitest als Testframework (neue Entwicklungsabhängigkeit)? Vorschlag: ja, es versteht TypeScript und den Pfad-Alias `@/` ohne Zusatzaufwand.
