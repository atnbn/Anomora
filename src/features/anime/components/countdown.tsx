"use client";

import { useClock } from "@/features/demo/clock";
import { countdownParts } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Countdown in Tagen, Stunden, Minuten – aktualisiert sich alle 30 Sekunden. */
export function Countdown({
  target,
  className,
}: {
  target: number;
  className?: string;
}) {
  const { now } = useClock();
  const parts = countdownParts(target, now);

  if (parts.done) {
    return (
      <p className={cn("font-semibold text-brand", className)}>
        Jetzt verfügbar
      </p>
    );
  }

  const units = [
    { value: parts.days, label: parts.days === 1 ? "Tag" : "Tage" },
    { value: parts.hours, label: "Std." },
    { value: parts.minutes, label: "Min." },
  ];

  return (
    <div
      className={cn("grid grid-cols-3 gap-2", className)}
      role="timer"
      aria-label={`Noch ${parts.days} ${parts.days === 1 ? "Tag" : "Tage"}, ${parts.hours} ${parts.hours === 1 ? "Stunde" : "Stunden"} und ${parts.minutes} ${parts.minutes === 1 ? "Minute" : "Minuten"}`}
    >
      {units.map((unit) => (
        <div
          key={unit.label}
          className="rounded-md bg-muted px-2 py-2 text-center"
          aria-hidden="true"
        >
          <span className="block font-display text-[1.75rem] leading-none font-bold tabular">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="mt-1 block text-[0.6875rem] font-semibold text-muted-foreground uppercase">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Kurzform für Listen: „in 2 T. 4 Std.“ */
export function CountdownBadge({
  target,
  className,
}: {
  target: number;
  className?: string;
}) {
  const { now } = useClock();
  const { days, hours, minutes, done } = countdownParts(target, now);
  const text = done
    ? "Verfügbar"
    : days > 0
      ? `in ${days} T. ${hours} Std.`
      : hours > 0
        ? `in ${hours} Std. ${minutes} Min.`
        : `in ${minutes} Min.`;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand tabular",
        className,
      )}
    >
      {text}
    </span>
  );
}
