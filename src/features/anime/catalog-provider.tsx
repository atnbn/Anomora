"use client";

import { useEffect } from "react";
import type { Anime } from "@/features/anime/types";
import { rememberAnime } from "@/features/anime/anime-cache";
import { setServerNow } from "@/features/demo/clock";
import { registerLiveAnime } from "@/lib/data/live-registry";

/**
 * Übergibt den serverseitig gecachten AniList-Katalog an die synchronen
 * Datenfunktionen. Registriert wird schon beim Rendern, damit auch die erste
 * Darstellung (Server und Hydrierung) die Live-Daten zeigt.
 */
export function CatalogProvider({
  catalog,
  fetchedAt,
  children,
}: {
  catalog: Anime[] | null;
  fetchedAt: number | null;
  children: React.ReactNode;
}) {
  if (catalog) registerLiveAnime(catalog, { silent: true });
  // Echte Termine sollen schon im vorgerenderten HTML stimmen.
  if (fetchedAt) setServerNow(fetchedAt);
  return <>{children}</>;
}

/**
 * Für Detailseiten von Anime außerhalb des Katalogs: macht den Datensatz im
 * Browser bekannt (Episoden, Favoriten) und merkt ihn sich für später.
 */
export function useRegisterAnime(anime: Anime) {
  if (anime.source === "anilist") registerLiveAnime([anime], { silent: true });
  useEffect(() => {
    if (anime.source === "anilist") rememberAnime([anime]);
  }, [anime]);
}
