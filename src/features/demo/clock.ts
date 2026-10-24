"use client";

import { useSyncExternalStore } from "react";
import { REFERENCE_NOW } from "@/data/demo/clock";

/**
 * Uhr für relative Zeitangaben und Countdowns.
 *
 * Beim Server-Rendering und der Hydrierung gilt der feste Referenzzeitpunkt,
 * damit keine Abweichungen entstehen. Danach läuft die echte Uhr; Demo-Daten
 * werden um `shift` verschoben, damit sie relativ zur echten Zeit aktuell bleiben.
 */

export type Clock = { now: number; shift: number; live: boolean };

const serverClock: Clock = { now: REFERENCE_NOW, shift: 0, live: false };
let clock: Clock = serverClock;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
// Einmal pro Sitzung festgelegt, damit Countdowns herunterzählen.
let sessionShift = 0;

function tick() {
  clock = { now: Date.now(), shift: sessionShift, live: true };
  for (const listener of listeners) listener();
}

export function startClock() {
  if (timer) return;
  sessionShift = Date.now() - REFERENCE_NOW;
  tick();
  timer = setInterval(tick, 30_000);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useClock(): Clock {
  return useSyncExternalStore(
    subscribe,
    () => clock,
    () => serverClock,
  );
}

/** Zeitpunkt eines Demo-Datensatzes in Millisekunden, mit der aktuellen Verschiebung. */
export function resolveTime(
  iso: string,
  shifted: boolean | undefined,
  current: Clock,
): number {
  const time = Date.parse(iso);
  return shifted ? time + current.shift : time;
}
