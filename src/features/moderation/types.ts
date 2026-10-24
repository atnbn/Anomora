export type ReportReason =
  "spam" | "harassment" | "spoiler" | "inappropriate" | "other";

export type ReportStatus = "open" | "resolved" | "dismissed";

export type ReportTargetType = "post" | "comment" | "user";

export type DemoReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  note?: string;
  reporterId: string;
  createdAt: string;
  status: ReportStatus;
  /** Wer die Meldung bearbeitet hat und wann. */
  handledBy?: string;
  handledAt?: string;
  seeded?: boolean;
};

export type UserBan = {
  userId: string;
  /** ISO-Zeitpunkt; null = dauerhaft. */
  until: string | null;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  seeded?: boolean;
};

export type ModerationAction =
  | "remove_content"
  | "restore_content"
  | "ban_user"
  | "unban_user"
  | "resolve_report"
  | "dismiss_report";

export type ModerationLogEntry = {
  id: string;
  action: ModerationAction;
  moderatorId: string;
  targetType: ReportTargetType;
  targetId: string;
  reportId?: string;
  note?: string;
  createdAt: string;
  seeded?: boolean;
};

export const reasonLabel: Record<ReportReason, string> = {
  spoiler: "Spoiler ohne Markierung",
  harassment: "Belästigung oder Hass",
  spam: "Spam oder Werbung",
  inappropriate: "Unangemessene Inhalte",
  other: "Sonstiges",
};

export const statusLabel: Record<ReportStatus, string> = {
  open: "Offen",
  resolved: "Erledigt",
  dismissed: "Abgewiesen",
};

export const targetLabel: Record<ReportTargetType, string> = {
  post: "Beitrag",
  comment: "Kommentar",
  user: "Profil",
};

export const actionLabel: Record<ModerationAction, string> = {
  remove_content: "Inhalt entfernt",
  restore_content: "Inhalt wiederhergestellt",
  ban_user: "Nutzer gesperrt",
  unban_user: "Sperre aufgehoben",
  resolve_report: "Meldung erledigt",
  dismiss_report: "Meldung abgewiesen",
};
