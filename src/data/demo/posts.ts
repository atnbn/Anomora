import type { Comment, Post } from "@/features/community/types";
import { minutesAgo } from "@/data/demo/clock";

const HOUR = 60;
const DAY = 24 * HOUR;

export const demoPosts: Post[] = [
  {
    id: "p-cosplay-ruffy",
    authorId: "u-max",
    body: "Endlich ist mein Ruffy-Cosplay fertig! Drei Wochen Arbeit, zwei kaputte Nähmaschinennadeln – aber der Strohhut sitzt. Nächste Con kann kommen.",
    animeId: "a-one-piece",
    category: "cosplay",
    media: [
      {
        kind: "anime-art",
        animeId: "a-one-piece",
        variant: 1,
        alt: "Demo-Artwork im Stil von One Piece, Sonne über dem Meer",
      },
      {
        kind: "anime-art",
        animeId: "a-one-piece",
        variant: 2,
        alt: "Demo-Artwork im Stil von One Piece, Abendhimmel",
      },
    ],
    containsSpoiler: false,
    createdAt: minutesAgo(2 * HOUR),
    baseLikeCount: 1240,
    seeded: true,
  },
  {
    id: "p-conan-reaction",
    authorId: "u-animefan",
    body: "Diese Folge hat mich fertiggemacht. Dass ausgerechnet der Zeuge die ganze Zeit gelogen hat und Conan es an der Uhr erkannt hat … warum endet sie genau dort?!",
    animeId: "a-detektiv-conan",
    episodeId: "detektiv-conan-1185",
    category: "discussion",
    media: [],
    containsSpoiler: true,
    createdAt: minutesAgo(4 * HOUR),
    baseLikeCount: 324,
    seeded: true,
  },
  {
    id: "p-nami-question",
    authorId: "u-nami",
    body: "Kurze Umfrage ohne Umfrage-Funktion: Welche Anime habt ihr dieses Jahr neu angefangen? Ich brauche Nachschub für die Herbstabende.",
    category: "discussion",
    media: [],
    containsSpoiler: false,
    createdAt: minutesAgo(5 * HOUR),
    baseLikeCount: 211,
    seeded: true,
  },
  {
    id: "p-naruto-hoodie",
    authorId: "u-mystic",
    body: "Habe mir endlich das Naruto-Hoodie geholt, auf das ich seit Monaten warte. Die Stickerei ist wirklich sauber. Wer von euch hat es auch?",
    animeId: "a-naruto-shippuden",
    category: "collection",
    media: [
      {
        kind: "anime-art",
        animeId: "a-naruto-shippuden",
        variant: 1,
        alt: "Demo-Artwork im Stil von Naruto Shippuden",
      },
      {
        kind: "anime-art",
        animeId: "a-naruto-shippuden",
        variant: 3,
        alt: "Demo-Artwork mit Spiralmotiv",
      },
      {
        kind: "anime-art",
        animeId: "a-naruto-shippuden",
        variant: 4,
        alt: "Demo-Artwork in warmen Orangetönen",
      },
    ],
    containsSpoiler: false,
    createdAt: minutesAgo(6 * HOUR),
    baseLikeCount: 856,
    seeded: true,
  },
  {
    id: "p-jjk-shelf",
    authorId: "u-kaito",
    body: "Kleines Samstags-Update: Neue Figur ist da, und die Vitrine wird langsam eng. Wer sammelt hier auch Jujutsu-Kaisen-Figuren? Zeigt mal eure Regale.",
    animeId: "a-jujutsu-kaisen",
    category: "collection",
    media: [
      {
        kind: "anime-art",
        animeId: "a-jujutsu-kaisen",
        variant: 2,
        alt: "Demo-Artwork im Stil von Jujutsu Kaisen",
      },
    ],
    containsSpoiler: false,
    createdAt: minutesAgo(8 * HOUR),
    baseLikeCount: 2100,
    seeded: true,
  },
  {
    id: "p-conan-reminder",
    authorId: "u-conanmaster",
    body: "Kleiner Reminder: Morgen kommt die neue Folge! Nach dem Ende von letzter Woche habe ich drei Theorien und keine davon gefällt mir. Habt ihr eine?",
    animeId: "a-detektiv-conan",
    category: "discussion",
    media: [],
    containsSpoiler: false,
    createdAt: minutesAgo(10 * HOUR),
    baseLikeCount: 498,
    seeded: true,
  },
  {
    id: "p-frieren-fanart",
    authorId: "u-sakura",
    body: "Fanart: Frieren und Fern im Herbstwald. Zwei Abende, eine Kanne Tee und sehr viele Blätter.",
    animeId: "a-frieren",
    category: "fanart",
    media: [
      {
        kind: "anime-art",
        animeId: "a-frieren",
        variant: 2,
        alt: "Demo-Artwork im Stil von Frieren, Sternenhimmel",
      },
    ],
    containsSpoiler: false,
    createdAt: minutesAgo(DAY + 2 * HOUR),
    baseLikeCount: 3420,
    seeded: true,
  },
  {
    id: "p-long-text",
    authorId: "u-long",
    body: "Ich habe Re:ZERO jetzt zum zweiten Mal komplett geschaut und bin überrascht, wie viele Details mir beim ersten Mal entgangen sind. Gerade in den frühen Folgen gibt es kleine Andeutungen, die erst später Sinn ergeben – Dialogzeilen, Hintergründe, sogar die Reihenfolge, in der Figuren auftauchen. Wer die Serie noch nicht kennt: Gebt ihr mindestens bis zur ersten großen Wendung eine Chance. Wer sie kennt: Welche Szene hat euch beim zweiten Mal am meisten überrascht? Bitte ohne Spoiler für die neueren Staffeln, ich hänge noch hinterher!",
    animeId: "a-rezero",
    category: "discussion",
    media: [],
    containsSpoiler: false,
    createdAt: minutesAgo(DAY + 3 * HOUR),
    baseLikeCount: 87,
    seeded: true,
  },
  {
    id: "p-zoro-logic",
    authorId: "u-zoro",
    body: "Wer sich verläuft, sieht mehr von der Welt. Das ist keine Ausrede, das ist eine Lebensphilosophie.",
    animeId: "a-one-piece",
    category: "discussion",
    media: [],
    containsSpoiler: false,
    createdAt: minutesAgo(2 * DAY),
    baseLikeCount: 1730,
    seeded: true,
  },
  {
    id: "p-team-welcome",
    authorId: "u-team",
    body: "Willkommen bei ANIMORA! Episodendiskussionen sind ab sofort für alle laufenden Serien geöffnet. Spoiler bitte markieren – Beiträge zu Folgen, die du noch nicht gesehen hast, werden automatisch verdeckt.",
    category: "news",
    media: [],
    containsSpoiler: false,
    createdAt: minutesAgo(3 * DAY),
    baseLikeCount: 940,
    seeded: true,
  },
];

type SeedComment = Omit<Comment, "id" | "createdAt" | "seeded"> & {
  age: number;
};

function seed(prefix: string, entries: SeedComment[]): Comment[] {
  return entries.map(({ age, ...entry }, index) => ({
    ...entry,
    id: `${prefix}-${index + 1}`,
    createdAt: minutesAgo(age),
    seeded: true,
  }));
}

const onPost = (postId: string) => ({ type: "post", postId }) as const;
const onEpisode = (episodeId: string) =>
  ({ type: "episode", episodeId }) as const;

const namiAnswers = [
  [
    "u-sakura",
    "Frieren! Hat mich komplett erwischt, besonders die ruhigen Folgen.",
  ],
  [
    "u-zoro",
    "Endlich Attack on Titan nachgeholt. Ich bin emotional nicht in der Verfassung, darüber zu reden.",
  ],
  ["u-mystic", "Dandadan. Völlig verrückt, genau richtig."],
  ["u-conanmaster", "Spy x Family – perfekt für zwischendurch."],
  ["u-kaito", "Solo Leveling, und jetzt warte ich ungeduldig."],
  [
    "u-manga",
    "Haikyu!! Ich hätte nie gedacht, dass mich Volleyball so mitnimmt.",
  ],
  ["u-shinichi", "Ich schaue gerade alte Conan-Filme, zählt das?"],
  ["u-max", "Re:ZERO, nachdem Henriette so davon geschwärmt hat."],
  ["u-long", "Sehr gute Wahl! Halte bis Folge 15 durch."],
  ["u-nami", "Danke euch, die Liste ist lang genug für den ganzen Winter."],
  ["u-animefan", "Demon Slayer, bin gerade bei Staffel 2."],
  ["u-sakura", "@AnimeFan123 der Zug-Arc ist so gut animiert!"],
  ["u-zoro", "Haikyu!! unterschreibe ich sofort."],
  [
    "u-mod",
    "Schöne Liste – wer mag, kann Empfehlungen auch unter #herbstanime posten.",
  ],
] as const;

export const demoComments: Comment[] = [
  ...seed("c-ruffy", [
    {
      authorId: "u-nami",
      target: onPost("p-cosplay-ruffy"),
      body: "Der Hut ist perfekt! Hast du die Krempe selbst geformt?",
      containsSpoiler: false,
      age: 100,
      baseLikeCount: 42,
    },
    {
      authorId: "u-max",
      target: onPost("p-cosplay-ruffy"),
      parentId: "c-ruffy-1",
      body: "Ja, mit Draht und sehr viel Geduld.",
      containsSpoiler: false,
      age: 90,
      baseLikeCount: 18,
    },
    {
      authorId: "u-zoro",
      target: onPost("p-cosplay-ruffy"),
      body: "Nächstes Mal komme ich als Zoro mit. Falls ich den Weg finde.",
      containsSpoiler: false,
      age: 75,
      baseLikeCount: 96,
    },
    {
      authorId: "u-sakura",
      target: onPost("p-cosplay-ruffy"),
      body: "Darf ich dich als Referenz für eine Zeichnung nehmen?",
      containsSpoiler: false,
      age: 40,
      baseLikeCount: 12,
    },
  ]),
  ...seed("c-conan", [
    {
      authorId: "u-conanmaster",
      target: onPost("p-conan-reaction"),
      body: "Die Uhr war von Anfang an im Bild – achtet mal auf die Szene im Flur.",
      containsSpoiler: true,
      age: 220,
      baseLikeCount: 51,
    },
    {
      authorId: "u-shinichi",
      target: onPost("p-conan-reaction"),
      body: "Ich habe es erst beim zweiten Schauen gemerkt.",
      containsSpoiler: false,
      age: 200,
      baseLikeCount: 8,
    },
  ]),
  ...seed(
    "c-nami",
    namiAnswers.map(([authorId, body], index) => ({
      authorId,
      target: onPost("p-nami-question"),
      body,
      containsSpoiler: false,
      age: 290 - index * 18,
      baseLikeCount: Math.max(0, 40 - index * 3),
    })),
  ),
  ...seed("c-frieren", [
    {
      authorId: "u-max",
      target: onPost("p-frieren-fanart"),
      body: "Die Farben sind wunderschön.",
      containsSpoiler: false,
      age: DAY,
      baseLikeCount: 14,
    },
    {
      authorId: "u-manga",
      target: onPost("p-frieren-fanart"),
      body: "Ferns Gesichtsausdruck ist so getroffen.",
      containsSpoiler: false,
      age: DAY - 60,
      baseLikeCount: 22,
    },
  ]),
  ...seed("c-ep-conan", [
    {
      authorId: "u-animefan",
      target: onEpisode("detektiv-conan-1185"),
      body: "Ich kann nicht glauben, wie das ausgegangen ist. Das ergibt doch überhaupt keinen Sinn!",
      containsSpoiler: false,
      age: 120,
      baseLikeCount: 42,
    },
    {
      authorId: "u-mystic",
      target: onEpisode("detektiv-conan-1185"),
      body: "Schaut euch die Szene bei 18:42 an. Die Spiegelung im Fenster verrät den Täter, bevor Conan es ausspricht.",
      containsSpoiler: true,
      age: 60,
      baseLikeCount: 128,
    },
    {
      authorId: "u-conanmaster",
      target: onEpisode("detektiv-conan-1185"),
      body: "Ich habe die Folge dreimal gesehen: Der Hinweis mit der stehengebliebenen Uhr kam schon in Folge 1181. Kein Zufall.",
      containsSpoiler: true,
      age: 50,
      baseLikeCount: 342,
    },
    {
      authorId: "u-kaito",
      target: onEpisode("detektiv-conan-1185"),
      body: "Ehrlich gesagt eher enttäuschend. Zu viele offene Fragen.",
      containsSpoiler: false,
      age: 35,
      baseLikeCount: 73,
    },
    {
      authorId: "u-shinichi",
      target: onEpisode("detektiv-conan-1185"),
      body: "Die letzten fünf Minuten waren Spannung pur. Freue mich auf morgen!",
      containsSpoiler: false,
      age: 28,
      baseLikeCount: 96,
    },
    {
      authorId: "u-manga",
      target: onEpisode("detektiv-conan-1185"),
      parentId: "c-ep-conan-4",
      body: "Ich glaube, die offenen Fragen werden nächste Woche aufgelöst.",
      containsSpoiler: false,
      age: 20,
      baseLikeCount: 11,
    },
  ]),
  ...seed("c-ep-op", [
    {
      authorId: "u-zoro",
      target: onEpisode("one-piece-1156"),
      body: "Die Animation im Schmiede-Kampf war unglaublich.",
      containsSpoiler: false,
      age: 3 * DAY,
      baseLikeCount: 210,
    },
    {
      authorId: "u-nami",
      target: onEpisode("one-piece-1156"),
      body: "Ruffys Entscheidung am Ende hat mich echt getroffen.",
      containsSpoiler: true,
      age: 3 * DAY - 120,
      baseLikeCount: 154,
    },
    {
      authorId: "u-max",
      target: onEpisode("one-piece-1156"),
      body: "Bester Episodentitel seit Langem.",
      containsSpoiler: false,
      age: 2 * DAY,
      baseLikeCount: 37,
    },
  ]),
  ...seed("c-ep-frieren", [
    {
      authorId: "u-sakura",
      target: onEpisode("frieren-34"),
      body: "Diese Folge war so ruhig und trotzdem die stärkste der Staffel.",
      containsSpoiler: false,
      age: 2 * DAY,
      baseLikeCount: 88,
    },
    {
      authorId: "u-manga",
      target: onEpisode("frieren-34"),
      body: "Der Zauber am Ende ist genau so, wie ich ihn mir beim Lesen vorgestellt habe.",
      containsSpoiler: true,
      age: DAY + 300,
      baseLikeCount: 64,
    },
  ]),
];
