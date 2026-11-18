/**
 * Tabellen `post_likes`, `comment_likes` und `post_saves`
 * (siehe supabase/migrations und docs/specs/likes.md).
 *
 * Reine Hilfsfunktionen ohne Supabase-Client, damit sie ohne Browser und
 * Datenbank testbar sind.
 */

/**
 * Wandelt die Zeilen einer Zählfunktion in eine Zuordnung ID → Zahl um.
 * IDs ohne Zeile (keine Likes) bekommen 0, damit sie als geladen gelten.
 */
export function countsByIds(
  requestedIds: string[],
  rows: Record<string, unknown>[],
  idKey: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of requestedIds) counts[id] = 0;
  for (const row of rows) {
    const id = row[idKey];
    if (typeof id === "string") counts[id] = Number(row.like_count) || 0;
  }
  return counts;
}

/**
 * Like-Zahl und eigener Like für die Anzeige.
 *
 * - `baseLikeCount`: feste Zahl aus den Demo-Daten (echte Inhalte: 0)
 * - `remoteCount`: Zahl aus der Datenbank, enthält einen eigenen Datenbank-Like
 * - `localLiked`: Like im Demo-Store (Demo-Konto oder Demo-Inhalt)
 * - `remoteLiked`: eigener Like in der Datenbank
 */
export function resolveLikeState(input: {
  baseLikeCount: number;
  remoteCount?: number;
  localLiked: boolean;
  remoteLiked: boolean;
}): { likeCount: number; liked: boolean } {
  return {
    likeCount:
      input.baseLikeCount +
      (input.remoteCount ?? 0) +
      (input.localLiked ? 1 : 0),
    liked: input.localLiked || input.remoteLiked,
  };
}

type DbError = { code?: string; message?: string } | null | undefined;

/** `23505`: Der Like oder das Lesezeichen existiert schon – kein Fehler für die Nutzerin. */
export function isDuplicateEntry(error: DbError): boolean {
  return error?.code === "23505";
}

export type LikeKind = "like" | "save";

/** Übersetzt Datenbankfehler beim Liken oder Speichern ins Deutsche. */
export function likeErrorMessage(
  error: DbError | Error,
  kind: LikeKind,
): string {
  const thing = kind === "like" ? "Like" : "Lesezeichen";
  const code = (error as { code?: string } | null | undefined)?.code;
  switch (code) {
    // Beitrag oder Kommentar wurde inzwischen gelöscht.
    case "23503":
      return "Dieser Inhalt existiert nicht mehr. Lade die Seite neu.";
    case "42501":
      return "Dafür fehlt die Berechtigung. Bitte melde dich erneut an.";
  }
  if (error?.message?.toLowerCase().includes("fetch"))
    return "Keine Verbindung. Prüfe dein Internet und versuche es erneut.";
  return `${thing} konnte nicht gespeichert werden.`;
}
