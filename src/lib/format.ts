// Feste Locale und Zeitzone, damit Server und Browser identisch formatieren.
const LOCALE = "de-DE";
const TIME_ZONE = "Europe/Berlin";

const relative = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: "auto",
  style: "long",
});
const dateShort = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});
const dateLong = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});
const integer = new Intl.NumberFormat(LOCALE);
const compact = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

export function formatRelative(time: number, now: number): string {
  const diffSeconds = Math.round((time - now) / 1000);
  const abs = Math.abs(diffSeconds);
  // Die Uhr tickt alle 30 s – frisch erstellte Inhalte liegen daher minimal „in der Zukunft“.
  if (abs < 60) return "gerade eben";
  if (abs < 3600)
    return relative.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400)
    return relative.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 86_400 * 7)
    return relative.format(Math.round(diffSeconds / 86_400), "day");
  return dateShort.format(time);
}

export function formatDateShort(time: number): string {
  return dateShort.format(time);
}

export function formatDateLong(time: number): string {
  return dateLong.format(time);
}

export function formatDateTime(time: number): string {
  return dateTime.format(time);
}

/** 1.240 bleibt ausgeschrieben, ab 10.000 wird verkürzt: 12,4 Tsd. */
export function formatCount(value: number): string {
  if (value < 10_000) return integer.format(value);
  if (value < 1_000_000) return `${compact.format(value / 1000)} Tsd.`;
  return `${compact.format(value / 1_000_000)} Mio.`;
}

export function pluralize(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

/** Countdown-Bestandteile bis zu einem Zeitpunkt. */
export function countdownParts(target: number, now: number) {
  const totalMinutes = Math.max(0, Math.floor((target - now) / 60_000));
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes / 60) % 24),
    minutes: totalMinutes % 60,
    done: target <= now,
  };
}
