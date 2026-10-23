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
| `supabase/migrations/`       | Platz für spätere versionierte SQL-Änderungen                                                          |

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

Öffne dein [Supabase-Projekt](https://supabase.com/dashboard/project/ybtcgpqartsuelpllbzt). Unter **Authentication → URL Configuration** verwendest du für die Entwicklung `http://localhost:3000` als Site URL. Ergänze Redirect-URLs für die tatsächlich implementierten Auth-Callbacks, sobald wir diese bauen. Diese Cloud-Einstellungen sind durch die lokalen Dateien noch nicht geändert worden.

Der Publishable Key ist für den Browser vorgesehen und ist kein Admin-Schlüssel. Datenzugriff wird über Datenbankberechtigungen und **Row Level Security (RLS)** geregelt. Lege neue Tabellen zusammen mit passenden RLS-Regeln an. Ein Secret- oder Service-Role-Key gehört niemals in `NEXT_PUBLIC_*`.

## Später Migrationen mit der Cloud verbinden

Die CLI ist mit fester Version als Entwicklungsabhängigkeit installiert. Der Publishable Key reicht für die App-Anbindung, aber nicht zur Verwaltung des Projekts oder zum Ausführen von Migrationen. Dafür meldest du dich separat bei Supabase an:

```powershell
npm.cmd run supabase:login
npm.cmd run supabase:link:dev
```

Die zweite Zeile verknüpft diesen Ordner ausdrücklich mit der bereitgestellten Entwicklungs-Projekt-ID. Falls die CLI nach einem Datenbankpasswort fragt, gib es ausschließlich im eigenen Terminal ein.

Eine neue Migration kannst du später mit `npx.cmd supabase migration new DEIN_NAME` erzeugen. Vor einem `db push` immer das verknüpfte Projekt und den SQL-Inhalt prüfen. Bisher wurden weder Tabellen noch Migrationen angelegt oder auf die Cloud angewendet. Für die reine Cloud-Anbindung brauchst du Docker nicht.

Offizielle Anleitungen: [Supabase mit Next.js und SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
