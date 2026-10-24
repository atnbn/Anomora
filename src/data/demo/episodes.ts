import type { Episode } from "@/features/anime/types";
import { demoAnime } from "@/data/demo/anime";
import { hoursFromNow } from "@/data/demo/clock";

/**
 * Demo-Episoden. Episodentitel, Inhalte und Termine sind erfunden und
 * im UI als Beispieldaten gekennzeichnet.
 */
type Schedule = {
  animeId: string;
  /** Stunden bis zur nächsten Ausstrahlung, relativ zu REFERENCE_NOW. */
  nextInHours: number;
  durationMinutes: number;
  /** Titel der letzten Episoden, älteste zuerst; der letzte Eintrag ist die kommende Folge. */
  titled: { title: string; synopsis: string }[];
};

const WEEK_HOURS = 24 * 7;

const schedules: Schedule[] = [
  {
    animeId: "a-one-piece",
    nextInHours: 52.5,
    durationMinutes: 24,
    titled: [
      {
        title: "Nebel über dem Riesenhafen",
        synopsis:
          "Die Crew erreicht einen Hafen, in dem nichts so groß ist, wie es scheint.",
      },
      {
        title: "Ein Versprechen aus Holz",
        synopsis:
          "Franky erinnert sich an eine alte Abmachung und trifft eine schwere Entscheidung.",
      },
      {
        title: "Die Stimme unter dem Eis",
        synopsis:
          "Ein Hilferuf führt Ruffy und Chopper in eine gefrorene Höhle.",
      },
      {
        title: "Kurs auf das Unbekannte",
        synopsis:
          "Nami entdeckt eine Strömung, die auf keiner Karte verzeichnet ist.",
      },
      {
        title: "Der Sturm der Schmiede",
        synopsis:
          "In der Schmiede eines Riesen entbrennt ein Kampf, mit dem niemand gerechnet hat.",
      },
      {
        title: "Was ein Kapitän trägt",
        synopsis:
          "Ruffy muss sich entscheiden, wen er beschützt – und was er dafür aufgibt.",
      },
      {
        title: "Der Anfang einer neuen Ära",
        synopsis:
          "Vorschau: Die Ereignisse der letzten Wochen verändern die Machtverhältnisse.",
      },
    ],
  },
  {
    animeId: "a-detektiv-conan",
    nextInHours: 28,
    durationMinutes: 24,
    titled: [
      {
        title: "Die Wahrheit im Schatten",
        synopsis:
          "Ein scheinbar perfekter Fall nimmt eine Wendung, als Ran eine Spiegelung bemerkt.",
      },
      {
        title: "Das Rätsel der stillen Uhr",
        synopsis:
          "In einem Uhrenmuseum bleibt um Mitternacht jede Uhr gleichzeitig stehen.",
      },
      {
        title: "Ein Alibi aus Glas",
        synopsis:
          "Kogoro ist überzeugt, den Täter zu kennen – doch dessen Alibi ist lückenlos.",
      },
      {
        title: "Mord im Nachtzug",
        synopsis:
          "Auf einer Fahrt nach Osaka verschwindet ein Fahrgast aus einem verschlossenen Abteil.",
      },
      {
        title: "Der letzte Zeuge",
        synopsis:
          "Conan muss einen Zeugen schützen, der mehr weiß, als er zugibt.",
      },
      {
        title: "Die Botschaft im Regen",
        synopsis:
          "Eine Nachricht auf einer beschlagenen Scheibe führt zu einem alten Fall zurück.",
      },
      {
        title: "Spuren auf dem Dach",
        synopsis:
          "Vorschau: Kaito Kid kündigt einen Coup an – ausgerechnet am Tag eines Mordes.",
      },
    ],
  },
  {
    animeId: "a-frieren",
    nextInHours: 97,
    durationMinutes: 24,
    titled: [
      {
        title: "Ein Lied für den Winter",
        synopsis:
          "Ein Dorf bittet Frieren um einen Zauber, der seit Jahrzehnten vergessen ist.",
      },
      {
        title: "Die Prüfung der Magier",
        synopsis:
          "Fern stellt sich einer Prüfung, bei der Kraft allein nicht genügt.",
      },
      {
        title: "Erinnerungen an einen Helden",
        synopsis: "Eine Statue Himmels weckt Erinnerungen an die alte Gruppe.",
      },
      {
        title: "Der Weg nach Norden",
        synopsis:
          "Die Gruppe muss einen Pass überqueren, den niemand freiwillig betritt.",
      },
      {
        title: "Ein leiser Abschied",
        synopsis:
          "Stark trifft eine Entscheidung, die ihm schwerer fällt als jeder Kampf.",
      },
      {
        title: "Licht im Schnee",
        synopsis:
          "In einer Winternacht zeigt Frieren Fern einen ihrer liebsten Zauber.",
      },
      {
        title: "Das Versprechen am See",
        synopsis:
          "Vorschau: An einem See löst Frieren ein Versprechen ein, das sie einst gab.",
      },
    ],
  },
];

function buildEpisodes(): Episode[] {
  const episodes: Episode[] = [];

  for (const anime of demoAnime) {
    const schedule = schedules.find((entry) => entry.animeId === anime.id);

    if (schedule) {
      // Erschienene Folgen: episodeCount; die kommende Folge ist episodeCount + 1.
      const upcomingNumber = anime.episodeCount + 1;
      for (let number = 1; number <= upcomingNumber; number++) {
        const weeksBefore = upcomingNumber - number;
        const titledIndex = schedule.titled.length - 1 - weeksBefore;
        const titled =
          titledIndex >= 0 ? schedule.titled[titledIndex] : undefined;
        episodes.push({
          id: `${anime.slug}-${number}`,
          animeId: anime.id,
          number,
          title: titled?.title,
          synopsis: titled?.synopsis,
          airDate: hoursFromNow(
            schedule.nextInHours - weeksBefore * WEEK_HOURS,
          ),
          durationMinutes: schedule.durationMinutes,
        });
      }
      continue;
    }

    // Abgeschlossene Serien: Episoden ohne Titel, ausgestrahlt vor dem Referenzjahr.
    for (let number = 1; number <= anime.episodeCount; number++) {
      const weeksBefore = anime.episodeCount - number;
      episodes.push({
        id: `${anime.slug}-${number}`,
        animeId: anime.id,
        number,
        airDate: hoursFromNow(-WEEK_HOURS * (weeksBefore + 52)),
        durationMinutes: 24,
      });
    }
  }

  return episodes;
}

export const demoEpisodes: Episode[] = buildEpisodes();
