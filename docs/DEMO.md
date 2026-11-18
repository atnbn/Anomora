# Demo-Modus

Anmeldung, Profile, Anime-Daten sowie Beiträge und Kommentare von Supabase-Konten sind echt (siehe [README](../README.md#stand)). Alle übrigen Community-Funktionen laufen bis zur Umstellung auf Supabase-Tabellen als Demo lokal im Browser. Sie liegen in `localStorage` unter dem Schlüssel `animora.demo.v1`. Dort werden keine Passwörter oder Geheimnisse gespeichert.

## Was simuliert ist

- Favoriten und „Gesehen“-Status je Konto
- Beiträge erstellen, bearbeiten und löschen mit dem Demo-Konto (Supabase-Konten schreiben in die Tabelle `posts`); die Beispiel-Beiträge tragen ein „Demo“-Abzeichen
- Kommentare und Antworten mit dem Demo-Konto und unter Demo-Beiträgen (Supabase-Konten schreiben unter echten Beiträgen und in Episodendiskussionen in die Tabelle `comments`); Beispiel-Kommentare tragen ein „Demo“-Abzeichen
- Likes und Speichern – auch auf echte Beiträge und Kommentare, aber nur in diesem Browser
- Folgen und Entfolgen, Nutzer blockieren, Inhalte melden
- Moderation: Rollen, Meldungen, Sperren, entfernte Inhalte und Protokoll liegen im selben lokalen Speicher. Es gibt noch keine serverseitige Rechteprüfung. Gesperrte Konten können nichts veröffentlichen oder kommentieren.
- Beim Demo-Konto **StrawHatMax**: Sitzung, Passwortänderung (wird nur geprüft) und „Andere Geräte abmelden“ (Attrappe)

## Hinweise

- **Demo-Daten zurücksetzen** im Profilmenü stellt den Ausgangszustand wieder her. Wer ältere Demo-Daten im Browser hat, sieht neue Beispiel-Meldungen erst danach.
- Demo-Termine werden beim Laden auf die aktuelle Uhrzeit verschoben, damit Countdowns sinnvoll sind.
- Lade- und Fehlerzustände vorführen: `/community?simulate=loading` und `/community?simulate=error`

## Aufbau im Code

| Ordner              | Inhalt                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `src/data/demo`     | Beispieldaten (Seeds)                                                  |
| `src/lib/data`      | Zugriffsfunktionen; Anime kommen bereits live über `src/lib/anime-api` |
| `src/features/demo` | Lokaler Store im Browser                                               |

Beim Umstellen eines Bereichs auf Supabase ändern sich nur die Zugriffsfunktionen, nicht die Oberfläche.
