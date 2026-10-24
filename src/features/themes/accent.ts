"use client";

import { useSyncExternalStore } from "react";

export const ACCENTS = [
  { id: "glut", label: "Glut", swatch: "oklch(0.62 0.19 40)" },
  { id: "ozean", label: "Ozean", swatch: "oklch(0.6 0.15 252)" },
  { id: "jade", label: "Jade", swatch: "oklch(0.6 0.12 162)" },
  { id: "sakura", label: "Sakura", swatch: "oklch(0.64 0.17 5)" },
  { id: "violett", label: "Violett", swatch: "oklch(0.6 0.18 295)" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

export const ACCENT_STORAGE_KEY = "animora.accent";

/** Läuft vor dem ersten Paint (siehe app/layout.tsx), damit die Akzentfarbe nicht flackert. */
export const accentBootScript = `try{var a=localStorage.getItem("${ACCENT_STORAGE_KEY}");if(a&&a!=="glut")document.documentElement.dataset.accent=a}catch(e){}`;

const listeners = new Set<() => void>();

function read(): AccentId {
  const value = document.documentElement.dataset.accent;
  return ACCENTS.some((accent) => accent.id === value)
    ? (value as AccentId)
    : "glut";
}

export function setAccent(accent: AccentId) {
  if (accent === "glut") delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = accent;
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // Ohne Speicher gilt die Auswahl nur bis zum Neuladen.
  }
  for (const listener of listeners) listener();
}

export function useAccent(): AccentId {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => "glut",
  );
}
