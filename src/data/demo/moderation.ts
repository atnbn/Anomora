import type {
  DemoReport,
  ModerationLogEntry,
  UserBan,
} from "@/features/moderation/types";
import { hoursFromNow, minutesAgo } from "@/data/demo/clock";

const HOUR = 60;
const DAY = 24 * HOUR;

/** Meldungen anderer Mitglieder, damit die Moderationsansicht nicht leer startet. */
export const demoReports: DemoReport[] = [
  {
    id: "r-seed-1",
    targetType: "post",
    targetId: "p-conan-reaction",
    reason: "spoiler",
    note: "Verrät das Ende der Folge, Markierung kam erst später dazu.",
    reporterId: "u-shinichi",
    createdAt: minutesAgo(3 * HOUR),
    status: "open",
    seeded: true,
  },
  {
    id: "r-seed-2",
    targetType: "post",
    targetId: "p-conan-reaction",
    reason: "spoiler",
    reporterId: "u-kaito",
    createdAt: minutesAgo(2 * HOUR),
    status: "open",
    seeded: true,
  },
  {
    id: "r-seed-3",
    targetType: "comment",
    targetId: "c-ep-conan-4",
    reason: "harassment",
    note: "Finde den Ton unfreundlich.",
    reporterId: "u-conanmaster",
    createdAt: minutesAgo(40),
    status: "open",
    seeded: true,
  },
  {
    id: "r-seed-4",
    targetType: "post",
    targetId: "p-zoro-logic",
    reason: "spam",
    reporterId: "u-animefan",
    createdAt: minutesAgo(DAY + 5 * HOUR),
    status: "open",
    seeded: true,
  },
  {
    id: "r-seed-5",
    targetType: "user",
    targetId: "u-long",
    reason: "inappropriate",
    note: "Nutzername ist absurd lang und stört das Layout.",
    reporterId: "u-zoro",
    createdAt: minutesAgo(2 * DAY),
    status: "dismissed",
    handledBy: "u-mod",
    handledAt: minutesAgo(2 * DAY - 3 * HOUR),
    seeded: true,
  },
  {
    id: "r-seed-6",
    targetType: "comment",
    targetId: "c-nami-11",
    reason: "other",
    reporterId: "u-mystic",
    createdAt: minutesAgo(3 * DAY),
    status: "resolved",
    handledBy: "u-mod",
    handledAt: minutesAgo(3 * DAY - HOUR),
    seeded: true,
  },
];

export const demoModerationLog: ModerationLogEntry[] = [
  {
    id: "l-seed-0",
    action: "ban_user",
    moderatorId: "u-mod",
    targetType: "user",
    targetId: "u-animefan",
    note: "Sperre für 3 Tage: Wiederholt Spoiler ohne Markierung gepostet.",
    createdAt: minutesAgo(DAY),
    seeded: true,
  },
  {
    id: "l-seed-1",
    action: "dismiss_report",
    moderatorId: "u-mod",
    targetType: "user",
    targetId: "u-long",
    reportId: "r-seed-5",
    note: "Kein Regelverstoß – lange Nutzernamen sind erlaubt.",
    createdAt: minutesAgo(2 * DAY - 3 * HOUR),
    seeded: true,
  },
  {
    id: "l-seed-2",
    action: "resolve_report",
    moderatorId: "u-mod",
    targetType: "comment",
    targetId: "c-nami-11",
    reportId: "r-seed-6",
    note: "Mit Nutzer:in gesprochen, Kommentar bleibt.",
    createdAt: minutesAgo(3 * DAY - HOUR),
    seeded: true,
  },
];

/** Eine befristete Sperre, damit die Ansicht „Gesperrt“ von Anfang an zu sehen ist. */
export const demoBans: UserBan[] = [
  {
    userId: "u-animefan",
    until: hoursFromNow(48),
    reason: "Wiederholt Spoiler ohne Markierung gepostet.",
    bannedBy: "u-mod",
    bannedAt: minutesAgo(DAY),
    seeded: true,
  },
];
