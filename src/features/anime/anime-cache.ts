"use client";

import { useCallback, useEffect, useState } from "react";
import type { Anime, AnimeSort, AnimeStatus } from "@/features/anime/types";
import { demoAnime } from "@/data/demo/anime";
import { registerLiveAnime } from "@/lib/data/live-registry";

/**
 * Browser-Cache für AniList-Daten – damit bereits geladene Daten nicht
 * erneut abgefragt werden.
 *
 * 1. Speicher (Map) für die laufende Sitzung,
 * 2. localStorage mit Ablaufzeit über Neuladen hinweg,
 * 3. laufende Anfragen werden geteilt: Fragen zwei Komponenten gleichzeitig
 *    dasselbe an, geht nur eine Anfrage raus.
 *
 * Darüber liegen die Server-Caches (`use cache` und CDN, siehe
 * `src/lib/anime-api/anilist.ts` und `app/api/anime/search/route.ts`).
 */

const SEARCH_KEY = "animora.anilist.search.v1";
const ANIME_KEY = "animora.anilist.anime.v1";
const SEARCH_TTL = 30 * 60 * 1000;
const ANIME_TTL = 7 * 24 * 60 * 60 * 1000;
const MAX_SEARCH_ENTRIES = 40;
const MAX_ANIME_ENTRIES = 300;

export type AnimeSearchParams = {
  search?: string;
  genre?: string;
  status?: AnimeStatus;
  sort?: AnimeSort;
  page?: number;
};

export type AnimeSearchResult = {
  items: Anime[];
  page: number;
  hasNextPage: boolean;
  total: number;
};

type Stamped<T> = { savedAt: number; value: T };

const curatedIds = new Set(demoAnime.map((anime) => anime.id));
const memory = new Map<string, Stamped<AnimeSearchResult>>();
const inflight = new Map<string, Promise<AnimeSearchResult>>();

function readStore<T>(key: string): Record<string, Stamped<T>> {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, Stamped<T>>) : {};
  } catch {
    return {};
  }
}

function writeStore<T>(
  key: string,
  store: Record<string, Stamped<T>>,
  max: number,
) {
  const entries = Object.entries(store)
    .toSorted((a, b) => b[1].savedAt - a[1].savedAt)
    .slice(0, max);
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(Object.fromEntries(entries)),
    );
  } catch {
    // Speicher voll oder gesperrt: dann bleibt es beim Speicher-Cache.
  }
}

/** Merkt sich Anime (z. B. Suchtreffer oder Favoriten) über Neuladen hinweg. */
export function rememberAnime(list: Anime[]) {
  registerLiveAnime(list);
  // Kuratierte Serien kommen bei jedem Seitenaufruf frisch aus dem Server-Cache.
  const extra = list.filter((anime) => !curatedIds.has(anime.id));
  if (extra.length === 0) return;
  const store = readStore<Anime>(ANIME_KEY);
  const now = Date.now();
  for (const anime of extra) store[anime.id] = { savedAt: now, value: anime };
  writeStore(ANIME_KEY, store, MAX_ANIME_ENTRIES);
}

/** Lädt gemerkte Anime ins Register; einmal beim Start aufrufen. */
export function loadRememberedAnime() {
  const store = readStore<Anime>(ANIME_KEY);
  const now = Date.now();
  const fresh = Object.values(store)
    .filter((entry) => now - entry.savedAt < ANIME_TTL)
    .map((entry) => entry.value);
  if (fresh.length > 0) registerLiveAnime(fresh);
}

export function searchKey(params: AnimeSearchParams) {
  return JSON.stringify({
    search: params.search?.trim().toLocaleLowerCase("de") || undefined,
    genre: params.genre || undefined,
    status: params.status || undefined,
    sort: params.sort ?? "popular",
    page: params.page ?? 1,
  });
}

/** Cache-Treffer ohne Netzwerk – für den ersten Render. */
export function peekSearch(
  params: AnimeSearchParams,
): AnimeSearchResult | undefined {
  const key = searchKey(params);
  const now = Date.now();
  const hit = memory.get(key);
  if (hit && now - hit.savedAt < SEARCH_TTL) return hit.value;
  if (typeof window === "undefined") return undefined;
  const stored = readStore<AnimeSearchResult>(SEARCH_KEY)[key];
  if (stored && now - stored.savedAt < SEARCH_TTL) {
    memory.set(key, stored);
    registerLiveAnime(stored.value.items);
    return stored.value;
  }
  return undefined;
}

export class AnimeSearchError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

export async function searchAnime(
  params: AnimeSearchParams,
): Promise<AnimeSearchResult> {
  const cached = peekSearch(params);
  if (cached) return cached;

  const key = searchKey(params);
  const running = inflight.get(key);
  if (running) return running;

  const query = new URLSearchParams();
  const normalized = JSON.parse(key) as Record<
    string,
    string | number | undefined
  >;
  for (const [name, value] of Object.entries(normalized)) {
    if (value !== undefined) query.set(name, String(value));
  }

  const promise = (async () => {
    let response: Response;
    try {
      response = await fetch(`/api/anime/search?${query}`);
    } catch {
      throw new AnimeSearchError(
        "Keine Verbindung. Prüfe dein Internet und versuche es erneut.",
        true,
      );
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new AnimeSearchError(
        body.error ?? "AniList ist gerade nicht erreichbar.",
        response.status >= 500,
      );
    }
    const result = (await response.json()) as AnimeSearchResult;
    const entry = { savedAt: Date.now(), value: result };
    memory.set(key, entry);
    const store = readStore<AnimeSearchResult>(SEARCH_KEY);
    store[key] = entry;
    writeStore(SEARCH_KEY, store, MAX_SEARCH_ENTRIES);
    rememberAnime(result.items);
    return result;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: AnimeSearchResult }
  | { status: "error"; error: AnimeSearchError };

type Settled =
  | {
      key: string;
      attempt: number;
      status: "success";
      result: AnimeSearchResult;
    }
  | { key: string; attempt: number; status: "error"; error: AnimeSearchError };

/** Suche mit Cache; `params = null` schaltet die Abfrage ab. */
export function useAnimeSearch(params: AnimeSearchParams | null) {
  const key = params ? searchKey(params) : null;
  const [settled, setSettled] = useState<Settled | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!key) return;
    let active = true;
    // searchAnime antwortet aus dem Cache, ohne das Netzwerk zu nutzen, wenn möglich.
    searchAnime(JSON.parse(key) as AnimeSearchParams)
      .then((result) => {
        if (active) setSettled({ key, attempt, status: "success", result });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSettled({
          key,
          attempt,
          status: "error",
          error:
            error instanceof AnimeSearchError
              ? error
              : new AnimeSearchError("Unbekannter Fehler.", true),
        });
      });
    return () => {
      active = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  let state: SearchState;
  if (!key) state = { status: "idle" };
  else if (settled?.key === key && settled.attempt === attempt) state = settled;
  else state = { status: "loading" };
  return { ...state, retry };
}

/** Wert erst übernehmen, wenn eine Weile nicht getippt wurde (spart Anfragen). */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
