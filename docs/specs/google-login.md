# Spezifikation: Anmeldung mit Google (Schritt 6)

Status: umgesetzt; Google-Anbieter und Migration noch nicht in der Cloud eingerichtet · Branch: `feat/google-login`

## Ziel

Besucher können sich mit ihrem Google-Konto registrieren und anmelden, zusätzlich zu E-Mail und Passwort. Neue Google-Konten durchlaufen wie alle anderen das Onboarding und wählen dort ihren Nutzernamen. Die App speichert keine Google-Zugangsdaten; Supabase Auth übernimmt den OAuth-Ablauf.

## Ausgangslage

- Anmeldung und Registrierung laufen über E-Mail und Passwort (`src/features/auth/supabase-auth.ts`, `login-form.tsx`, `register-form.tsx`).
- `/auth/confirm` tauscht bereits einen `code` (PKCE) gegen eine Sitzung und leitet auf `next` weiter. Genau diesen Weg nutzt auch die Rückkehr von Google. Die Redirect-URLs in Supabase erlauben `/**` für Live-Seite, `localhost` und Previews.
- Neue Konten bekommen ihr Profil per Trigger aus den Nutzer-Metadaten (`create_profile_from_metadata`). Google liefert `full_name`, `name`, `email` und `avatar_url`, aber keinen `username`. Das Profil erhält dann den Ersatznamen `user_…`, als Anzeigename ebenfalls den Ersatznamen, und `onboarding_complete = false`.
- Das Onboarding erlaubt, Nutzername und Anzeigename zu ändern.
- `/auth/confirm` leitet nach dem Austausch immer auf `next` weiter, ohne den Onboarding-Status zu prüfen. Fehlt der `code` (z. B. Abbruch bei Google mit `?error=access_denied`), landet man auf „Link ungültig“.
- Die Registrierung verlangt die Zustimmung zu Nutzungsbedingungen und Datenschutzerklärung (Checkbox).
- „Passwort ändern“ prüft das aktuelle Passwort. Reine Google-Konten haben keins.

## Umfang

1. **Knopf „Mit Google fortfahren“** auf Anmelde- und Registrierungsseite. Er ruft `signInWithOAuth({ provider: "google" })` mit `redirectTo` auf `/auth/confirm?next=…` der aktuellen Adresse.
2. **`/auth/confirm`** prüft nach dem Austausch die Profilzeile: Ist `onboarding_complete` noch `false`, geht es zu `/onboarding`, sonst zu `next`. Kommt Google mit einem Fehler zurück, leitet die Route auf `/login?error=oauth` und die Anmeldeseite zeigt eine verständliche Meldung.
3. **Anzeigename aus Google** (Entscheidung 2): Migration `20261119120000_profile_name_from_google.sql`, die `create_profile_from_metadata` per `create or replace` so erweitert, dass `full_name` bzw. `name` als Anzeigename dient, wenn `display_name` fehlt. Keine Tabelle wird geändert oder gelöscht.
4. **Kontoeinstellungen** (Entscheidung 4): Bei Konten ohne Passwort-Zugang zeigt „Konto & Sicherheit“ statt „Passwort ändern“ den Hinweis „Du meldest dich mit Google an“. Erkannt über die Identitäten des Supabase-Nutzers.
5. **Tests** (Vitest) für die Weiterleitung nach der Rückkehr, die Fehlerauswertung, das Erkennen des Anmeldewegs und die Migration.
6. **Doku**: `docs/SUPABASE.md` mit der Einrichtung in Google Cloud und Supabase, README („Stand“).

## Einrichtung außerhalb des Codes (machst du)

Das braucht ein Google-Konto mit Zugriff auf die Google Cloud Console und das Supabase-Dashboard. Das Client Secret ist ein Geheimnis: Es kommt nur ins Supabase-Dashboard, nie ins Repository, in `.env.local` oder in Vercel.

1. **Google Cloud Console → APIs & Dienste → OAuth-Zustimmungsbildschirm:** Typ „Extern“, App-Name „ANIMORA“, Support-E-Mail, Bereiche `openid`, `email`, `profile`. Solange der Status „Testen“ ist, können sich nur eingetragene Testnutzer anmelden.
2. **Anmeldedaten → OAuth-Client-ID erstellen:** Typ „Webanwendung“. Autorisierte Weiterleitungs-URI: `https://pkjhfyjyoygmoyqmmwng.supabase.co/auth/v1/callback`.
3. **Supabase → Authentication → Providers → Google:** aktivieren, Client-ID und Client Secret eintragen, speichern.
4. **Veröffentlichen:** Für alle Besucher den Zustimmungsbildschirm auf „In Produktion“ stellen. Für die Bereiche `email` und `profile` ist keine Google-Prüfung nötig; mit eigenem Logo kann Google eine Markenprüfung verlangen.

Die Redirect-URLs in Supabase passen bereits (`/**`). Neue Umgebungsvariablen braucht die App nicht.

## Nicht im Umfang

- Weitere Anbieter (Apple, Discord, GitHub). Der Aufbau erlaubt sie später mit wenig Aufwand.
- Google-Profilbild als Avatar: Die App nutzt generierte Avatare, Bilder kommen mit dem Storage-Schritt.
- Passwort nachträglich für ein Google-Konto festlegen, Google-Verknüpfung in den Einstellungen lösen.
- Rechtstexte: Die Datenschutzerklärung (Vorlage) sollte Google als Anmeldedienst nennen; das trägst du selbst ein (siehe Entscheidung 5).

## Abläufe

**Anmelden oder Registrieren mit Google:** Knopf → Weiterleitung zu Google → Zustimmung → zurück zu Supabase → `/auth/confirm?code=…&next=…` → Sitzung. Neue Konten landen im Onboarding und wählen dort Nutzername und Anzeigename, bestehende Konten auf `next` (Standard `/dashboard`).

**Bestehendes Konto mit derselben E-Mail:** Supabase verknüpft eine bestätigte Google-Adresse automatisch mit einem vorhandenen Konto gleicher E-Mail. Wer sich vorher mit E-Mail und Passwort registriert hat, landet mit Google im selben Konto mit Profil, Beiträgen und Likes. Beide Anmeldewege funktionieren danach.

**Abbruch bei Google:** zurück auf die Anmeldeseite mit „Die Anmeldung mit Google wurde abgebrochen oder ist fehlgeschlagen.“

**Ohne Supabase-Konfiguration oder Anbieter:** Der Knopf ist deaktiviert, wenn Supabase fehlt. Ob Google in Supabase aktiviert ist, prüft die App vor dem Start über die öffentlichen Auth-Einstellungen (`/auth/v1/settings`), weil `signInWithOAuth` selbst nur weiterleitet und keinen Fehler zurückgibt. Ist Google aus, zeigt der Knopf „Die Anmeldung mit Google ist gerade nicht verfügbar.“

## Akzeptanzkriterien

- [ ] Ein neues Google-Konto wird angelegt, bekommt ein Profil (Anzeigename aus Google, Ersatz-Nutzername) und landet im Onboarding.
- [ ] Nach dem Onboarding führt jede weitere Google-Anmeldung direkt auf `next` bzw. `/dashboard`.
- [ ] Ein bestehendes E-Mail-Konto mit derselben Adresse wird verknüpft, nicht doppelt angelegt.
- [ ] Abbruch bei Google führt zurück zur Anmeldeseite mit Meldung, nicht auf „Link ungültig“.
- [ ] Google-Konten sehen in „Konto & Sicherheit“ keinen Passwort-Dialog, der nicht funktionieren kann.
- [ ] Funktioniert auf der Live-Seite und lokal; Previews, sobald die Redirect-URL des Teams erlaubt ist.
- [ ] E-Mail-Anmeldung und Demo-Modus funktionieren unverändert.
- [x] `npm run test`, `npm run lint`, `npm run typecheck` und `npm run build` sind lokal grün.
- [x] Tests decken ab: Fehler der Rückkehr, Meldungen, Ziel nach dem Einlösen (Onboarding, Reset), Anmeldewege eines Kontos und die Migration (ersetzt nur die Funktion, nutzt `full_name`/`name`).

## Anwenden in der Cloud

Die Migration (nur `create or replace function`) wie bisher nach Review und deinem OK: `migration list`, `db push --dry-run`, `db push`. Den Google-Anbieter aktivierst du im Dashboard (siehe oben). Reihenfolge egal; ohne Anbieter zeigt der Knopf eine Fehlermeldung, ohne Migration ist der Anzeigename vorerst der Ersatzname.

## Entscheidungen (bestätigt am 19.11.2026)

1. **Zustimmung bei der Registrierung mit Google:** Unter dem Google-Knopf steht „Mit der Anmeldung über Google stimmst du den Nutzungsbedingungen und der Datenschutzerklärung zu“ (mit Links), statt einer eigenen Checkbox. Das ist bei OAuth üblich.
2. **Anzeigename aus Google übernehmen:** ja (`full_name`, sonst `name`, auf 40 Zeichen gekürzt). Der Nutzername bleibt der Ersatzname bis zum Onboarding, weil Google-Namen selten die Regeln für Nutzernamen erfüllen.
3. **Onboarding-Prüfung in `/auth/confirm`:** ja, serverseitig nach dem Austausch des Codes. Davon profitieren auch E-Mail-Bestätigungslinks.
4. **„Passwort ändern“ für reine Google-Konten:** ausblenden und den Hinweis zeigen. Passwort nachträglich festlegen kommt später, falls gewünscht.
5. **Datenschutzerklärung:** Die Vorlage hat einen Absatz „Anmeldung mit Google“ mit Platzhalter für Anbieter, Rechtsgrundlage und Drittlandübermittlung; den endgültigen Text prüfst du selbst.
