/**
 * Alle Demo-Zeitpunkte sind relativ zu diesem festen Referenzzeitpunkt definiert.
 * So sind Server-Rendering und erste Client-Darstellung identisch; nach dem Laden
 * verschiebt `useClock` die Demo-Daten auf die echte Uhrzeit (siehe features/demo).
 */
export const REFERENCE_NOW = Date.UTC(2026, 9, 23, 16, 0, 0);

const MINUTE = 60_000;

export function minutesAgo(minutes: number): string {
  return new Date(REFERENCE_NOW - minutes * MINUTE).toISOString();
}

export function hoursFromNow(hours: number): string {
  return new Date(REFERENCE_NOW + hours * 60 * MINUTE).toISOString();
}
