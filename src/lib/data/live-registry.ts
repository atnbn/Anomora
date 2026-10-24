import type { Anime } from "@/features/anime/types";

/**
 * Laufzeit-Register für Anime-Daten von AniList.
 *
 * Wird mit dem gecachten Katalog (über den CatalogProvider) sowie mit
 * Such- und Detailergebnissen gefüllt. Die synchronen Zugriffsfunktionen in
 * `lib/data/anime.ts` lesen zuerst hier und fallen sonst auf Demo-Daten zurück.
 * Auf dem Server enthält es nur globale, nutzerunabhängige Daten.
 */

const byId = new Map<string, Anime>();
const bySlug = new Map<string, Anime>();
const listeners = new Set<() => void>();
let version = 0;

/**
 * `silent` registriert ohne Benachrichtigung – für Aufrufe während des
 * Renderns, bei denen die folgenden Komponenten die Daten ohnehin lesen.
 */
export function registerLiveAnime(list: Anime[], { silent = false } = {}) {
  let changed = false;
  for (const anime of list) {
    const current = byId.get(anime.id);
    if (current === anime) continue;
    byId.set(anime.id, anime);
    bySlug.set(anime.slug, anime);
    changed = true;
  }
  if (changed) {
    version += 1;
    if (silent) return;
    for (const listener of listeners) listener();
  }
}

export function getLiveAnime(id: string): Anime | undefined {
  return byId.get(id);
}

export function getLiveAnimeBySlug(slug: string): Anime | undefined {
  return bySlug.get(slug);
}

export function listLiveAnime(): Anime[] {
  return [...byId.values()];
}

export function subscribeLiveAnime(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLiveVersion() {
  return version;
}
