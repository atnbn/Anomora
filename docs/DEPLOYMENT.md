# Preview-Deployments mit Vercel

## Was vorbereitet ist

Das Repository verwendet die direkte GitHub-Integration von Vercel. Feature-Branches bekommen nach dem Push ein Preview-Deployment mit eigener URL. Die URL erscheint am zugehörigen Pull Request, sobald Vercel das Repository verbunden und erfolgreich gebaut hat.

| Datei                       | Aufgabe                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`  | Prüft Pull Requests nach `main` und Pushes auf `main` mit GitHub Actions     |
| `vercel.json`               | Konfiguriert Next.js, Installation und Qualitätsprüfungen vor dem Deployment |
| `.nvmrc` und `package.json` | Legen Node.js 22 für Entwicklung, CI und Vercel fest                         |
| `scripts/check-env.mjs`     | Bricht bei fehlenden Supabase-Umgebungsvariablen ab                          |

Die Konfiguration ist zunächst auf Previews ausgerichtet: Automatische Git-Deployments für `main` sind in `vercel.json` deaktiviert. Für einen späteren Produktionsbetrieb muss diese Einstellung angepasst werden. Sie verhindert keine manuell gestarteten Produktionsdeployments oder einen separat ausgelösten ersten Import-Deploy.

## Wie die Pipeline arbeitet

1. Du pushst einen Feature-Branch und öffnest einen Pull Request nach `main`.
2. GitHub Actions installiert die Pakete mit `npm ci` aus der Lockdatei.
3. Die Pipeline prüft Umgebungsvariablen, Formatierung, ESLint, TypeScript und den Produktions-Build.
4. Vercel baut denselben Branch unabhängig über seine GitHub-Anbindung. Vor dem Build führt Vercel dieselben Qualitätsprüfungen aus. Schlägt eine davon fehl, wird dieses Deployment nicht veröffentlicht.
5. Nach erfolgreichem Build erhältst du die Preview-URL im Vercel-Dashboard und am Pull Request.

Vercel wartet bei diesem Aufbau nicht auf den GitHub-Actions-Job. Stattdessen erzwingt sein eigener Build die gleichen Prüfungen. Vorher wird ausschließlich die im Cloud-Build bereitgestellte `vercel.json` mit Prettier normalisiert, damit deren Formatierung den Build nicht blockiert. GitHub Actions prüft die ursprünglichen Repository-Dateien ohne vorherige Formatierung. Neue Pushes auf einen Branch erzeugen neue Previews, auch wenn noch kein Pull Request geöffnet wurde. Der GitHub-Actions-Workflow startet bei Pull Requests nach `main` und beim Push auf `main`.

Die CI verwendet ausdrücklich Dummy-Werte für Supabase und verändert keine Cloud-Daten. Sie testet die Codequalität und den Build, aber nicht die Datenbankverbindung oder eine Benutzeranmeldung. Vercel braucht dagegen die echten Werte des Entwicklungsprojekts für eine funktionsfähige Preview.

## Einmalig im Vercel-Konto aktivieren

Für diese Schritte brauchst du Zugriff auf dein Vercel-Konto. Lokale Dateien allein legen kein Hosting-Projekt an.

1. Importiere [atnbn/Anomora](https://github.com/atnbn/Anomora) als GitHub-Repository in Vercel oder verbinde ein bereits vorhandenes Vercel-Projekt damit.
2. Verwende **Next.js** als Framework, das Projektverzeichnis `.` und Node.js **22.x**. Die Installations- und Build-Befehle kommen aus `vercel.json`.
3. Lege unter **Settings → Environment Variables** diese Variablen für **Preview** an:

   | Variable                               | Wert                                                            |
   | -------------------------------------- | --------------------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | URL deines Supabase-Entwicklungsprojekts aus `.env.local`       |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable Key desselben Entwicklungsprojekts aus `.env.local` |

4. Prüfe die Git-Verbindung und lasse `main` als Production Branch eingetragen. Die versionierte Konfiguration deaktiviert automatische Deployments dieses Branches; andere Branches werden als Preview behandelt.
5. Starte eine Preview aus einem Feature-Branch, der alle neuen Dateien einschließlich der Supabase-Anbindung enthält. Ein erneutes Deployment ist erforderlich, wenn du später Umgebungsvariablen änderst.

Für diesen Aufbau sind kein Vercel-Token und keine Deployment-Secrets in GitHub Actions erforderlich. Die Vercel-GitHub-App erhält beim Verbinden Zugriff auf das ausgewählte Repository. Die `.env.local` wird nicht hochgeladen oder committet.

## Dein täglicher Ablauf

```powershell
git switch -c feat/DEIN-THEMA
# Dateien bearbeiten
npm.cmd run build:preview
git add PFAD-ZUR-GEAENDERTEN-DATEI
git commit -m "feat: Beschreibung der Änderung"
git push -u origin feat/DEIN-THEMA
```

Ersetze die Platzhalter und füge alle zur Änderung gehörenden Dateien hinzu. Öffne danach einen Pull Request nach `main`. Kontrolliere **CI / Quality and build**, den Vercel-Status und die Preview im Browser.

Unter GitHub **Settings → Rules → Rulesets** kannst du später für `main` den Statuscheck **Quality and build** verpflichtend machen. Die lokale Workflow-Datei aktiviert keinen Branch-Schutz. Ein fehlgeschlagenes Vercel-Deployment lässt eine eventuell vorhandene ältere Preview unverändert; es entsteht dann keine neue erfolgreiche Version.

## Supabase und Auth in Previews

Die Preview greift auf das separate Supabase-Entwicklungsprojekt zu. Die [Supabase-Anleitung](SUPABASE.md) erklärt die Clients und Umgebungsvariablen.

Sobald Auth-Callbacks implementiert sind, ergänze unter Supabase **Authentication → URL Configuration → Redirect URLs** die erlaubten Preview-Adressen. Verwende konkrete URLs oder ein auf deinen tatsächlichen Vercel-Team-Slug beschränktes Muster wie `https://*-DEIN-TEAM.vercel.app/**`. Der Team-Slug muss ersetzt werden. Aktuell gibt es noch keine Login-Funktion und keine Auth-Callbacks.

## Fehler verstehen

- **Fehlende Umgebungsvariablen:** Beide Werte für die Vercel-Umgebung Preview anlegen und neu deployen.
- **Formatierung:** Lokal `npm.cmd run format` ausführen und die formatierten Dateien committen.
- **TypeScript oder ESLint:** Die Meldungen lokal mit `npm.cmd run check` nachvollziehen und beheben.
- **Kein Preview-Deployment:** Prüfen, ob das Repository verbunden ist, die Konfiguration gepusht wurde und du auf einem Branch außerhalb von `main` arbeitest.
- **CI erfolgreich, Supabase funktioniert nicht:** CI nutzt Dummy-Werte. Prüfe die echten Preview-Variablen und den Status des Entwicklungsprojekts.

Offizielle Quellen: [Vercel für GitHub](https://vercel.com/docs/git/vercel-for-github), [Git-Deployment-Konfiguration](https://vercel.com/docs/project-configuration/git-configuration), [Vercel-Umgebungsvariablen](https://vercel.com/docs/environment-variables), [Supabase Redirect-URLs](https://supabase.com/docs/guides/auth/redirect-urls).
