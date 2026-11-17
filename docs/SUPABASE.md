# Supabase für die Cloud-Entwicklung

Die Next.js-App ist für das bereitgestellte Projekt `ybtcgpqartsuelpllbzt` vorbereitet. Verwende dieses Projekt ausschließlich für Entwicklung und Testdaten. Eine spätere Produktionsumgebung erhält ein eigenes Supabase-Projekt und eigene Umgebungsvariablen.

## Starten und Verbindung prüfen

Die Datei `.env.local` enthält bereits die bereitgestellte Projekt-URL und den Publishable Key. Sie wird von Git ignoriert. `.env.example` ist eine versionierte Vorlage ohne echte Zugangsdaten für andere Entwickler.

```powershell
npm.cmd run supabase:check
npm.cmd run dev
```

Der Verbindungscheck ruft die Auth-Konfiguration lesend ab. Ein HTTP-200-Ergebnis bestätigt, dass Supabase erreichbar ist und den Schlüssel akzeptiert. Er prüft keine Tabellen, Datenbankrechte oder Anmeldung eines Benutzers.

Starte den Entwicklungsserver nach Änderungen an `.env.local` neu. In einer späteren Hosting-Umgebung musst du die Variablen separat konfigurieren; die lokale Datei wird nicht hochgeladen. `NEXT_PUBLIC_*` wird beim Build für Browsercode eingebunden.

## Die neuen Dateien

| Datei                        | Aufgabe                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/lib/supabase/env.ts`    | Liest die beiden benötigten Umgebungsvariablen und meldet fehlende Werte                               |
| `src/lib/supabase/client.ts` | Erstellt einen Supabase-Client für Client Components                                                   |
| `src/lib/supabase/server.ts` | Erstellt pro Request einen Client für Server Components, Server Actions und Route Handlers             |
| `src/lib/supabase/proxy.ts`  | Erneuert vorhandene Auth-Sitzungen und überträgt Cookies und Cache-Header                              |
| `src/proxy.ts`               | Bindet die Sitzungsaktualisierung in Next.js ein                                                       |
| `scripts/check-supabase.mjs` | Prüft die Cloud-Verbindung ohne Daten zu verändern                                                     |
| `supabase/config.toml`       | CLI-Konfiguration für einen optionalen lokalen Stack; konfiguriert nicht automatisch das Cloud-Projekt |
| `supabase/migrations/`       | Versionierte SQL-Änderungen; die erste legt die Profiltabelle an (siehe unten)                         |

## Clients verwenden

Auf dem Server:

```ts
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase.auth.getClaims();
```

Im Browser, innerhalb einer Client Component:

```ts
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

Der Proxy aktualisiert vorhandene Sitzungen, erzwingt aber noch keine Anmeldung. Zum Schutz späterer Seiten und Aktionen musst du die verifizierten Claims und Berechtigungen prüfen. Eine Route Group wie `(platform)` allein schützt keine Route. Bei Server Components mit Request-Daten wie Cookies ist im aktuellen Next.js mit Cache Components eine passende `Suspense`-Grenze erforderlich.

Der Server-Client gehört nicht in einen globalen Singleton oder einen gemeinsam genutzten Cache. Bei Route Handlers mit Auth-Cookies dürfen Antworten nicht öffentlich zwischengespeichert werden; setze dort `Cache-Control: private, no-store`.

## Cloud-Projekt konfigurieren

Öffne dein [Supabase-Projekt](https://supabase.com/dashboard/project/ybtcgpqartsuelpllbzt). Diese Cloud-Einstellungen ändern die lokalen Dateien nicht – sie müssen im Dashboard gesetzt werden:

1. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (später die Produktions-URL)
   - Redirect URLs: `http://localhost:3000/auth/confirm` und für Vercel-Previews z. B. `https://*-<team>.vercel.app/auth/confirm`
2. **Authentication → Providers → Email:** „Confirm email“ bleibt aktiv (ANIMORA setzt die Bestätigung voraus).
3. **E-Mail-Versand:** Der eingebaute Versand von Supabase ist nur für Tests gedacht und stark begrenzt (wenige Mails pro Stunde). Für echte Nutzer unter **Authentication → SMTP Settings** einen eigenen SMTP-Dienst eintragen.
4. **E-Mail-Vorlagen:** Die Standardvorlagen funktionieren. Ihre Links nutzen PKCE und müssen deshalb im selben Browser geöffnet werden, in dem registriert bzw. der Reset angefordert wurde. Für browserunabhängige Links die Vorlagen auf `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/onboarding` (Reset: `type=recovery&next=/reset-password`) umstellen – `/auth/confirm` unterstützt beide Varianten. Wird ein PKCE-Bestätigungslink in einem anderen Browser geöffnet, ist die Adresse trotzdem bestätigt (Supabase prüft den Link vor der Weiterleitung); die App zeigt dann „E-Mail-Adresse bestätigt – jetzt anmelden“. Ein erneutes Senden an eine schon bestätigte Adresse verschickt keine Mail.

## Anmeldung in ANIMORA

| Datei                                 | Aufgabe                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/auth/supabase-auth.ts`  | Registrieren, Anmelden, Abmelden, Bestätigung erneut senden, Passwort zurücksetzen/ändern, E-Mail ändern, Profil-Metadaten speichern; übersetzt Fehler ins Deutsche |
| `src/app/auth/confirm/route.ts`       | Ziel der E-Mail-Links: tauscht `code` (PKCE) bzw. `token_hash` gegen eine Sitzung und leitet nur auf interne Pfade weiter                                           |
| `src/features/demo/demo-provider.tsx` | startet `onAuthStateChange` und spiegelt das Konto in den Store                                                                                                     |

- Die Sitzung liegt in Cookies; der Proxy erneuert sie. Seiten lesen die Sitzung im Browser, damit sie statisch vorgerendert bleiben.
- Profilangaben (Nutzername, Anzeigename, Beschreibung, Avatarfarbe, Onboarding-Status) liegen in der Tabelle **`profiles`** (Schritt 2, siehe [specs/profiles.md](specs/profiles.md)). Ist die Migration noch nicht angewendet, nutzt die App weiter die **Nutzer-Metadaten**.
- Favoriten, Beiträge, Kommentare und Moderation liegen weiterhin im Browser (Demo-Store), sind aber dem echten Konto zugeordnet.
- Konto löschen braucht eine Server-Funktion mit Service-Role-Schlüssel und kommt in einem späteren Schritt.
- Die Demo-Konten (`Demo ansehen`) bleiben bestehen und laufen ohne Supabase.

## Profiltabelle

Die Migration `supabase/migrations/20261117120000_create_profiles.sql` legt an:

| Teil                           | Aufgabe                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Tabelle `profiles`             | Profil je Konto; Constraints entsprechen `src/lib/validation/auth.ts`, Nutzername eindeutig ohne Groß/klein |
| RLS und Spaltenrechte          | Alle dürfen lesen; angemeldete Nutzer ändern nur ihr eigenes Profil und nie `role`                          |
| Trigger `on_auth_user_created` | Legt bei der Registrierung das Profil aus den Metadaten an; bei Namenskonflikt mit Ersatznamen `user_…`     |
| Funktion `username_available`  | Prüft vor der Registrierung, ob ein Name frei ist                                                           |
| Übernahme                      | Bereits registrierte Konten bekommen beim Anwenden einmalig ein Profil                                      |

Die App spricht die Tabelle über `src/features/auth/supabase-auth.ts` an; reine Umwandlungen liegen in `src/features/profiles/profile-row.ts`. Die Migration wird nicht automatisch angewendet (siehe unten).

Der Publishable Key ist für den Browser vorgesehen und ist kein Admin-Schlüssel. Datenzugriff wird über Datenbankberechtigungen und **Row Level Security (RLS)** geregelt. Lege neue Tabellen zusammen mit passenden RLS-Regeln an. Ein Secret- oder Service-Role-Key gehört niemals in `NEXT_PUBLIC_*`.

## Später Migrationen mit der Cloud verbinden

Die CLI ist mit fester Version als Entwicklungsabhängigkeit installiert. Der Publishable Key reicht für die App-Anbindung, aber nicht zur Verwaltung des Projekts oder zum Ausführen von Migrationen. Dafür meldest du dich separat bei Supabase an:

```powershell
npm.cmd run supabase:login
npm.cmd run supabase:link:dev
```

Die zweite Zeile verknüpft diesen Ordner ausdrücklich mit der bereitgestellten Entwicklungs-Projekt-ID. Falls die CLI nach einem Datenbankpasswort fragt, gib es ausschließlich im eigenen Terminal ein.

Eine neue Migration kannst du mit `npx.cmd supabase migration new DEIN_NAME` erzeugen. Vor einem `db push` immer das verknüpfte Projekt und den SQL-Inhalt prüfen. Welche Migrationen in der Cloud schon angewendet sind, zeigt `npx.cmd supabase migration list`; anwenden mit `npx.cmd supabase db push`. Für die reine Cloud-Anbindung brauchst du Docker nicht.

Offizielle Anleitungen: [Supabase mit Next.js und SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
