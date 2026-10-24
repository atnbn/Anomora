"use client";

import { useMemo } from "react";
import { HeartIcon, LogInIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import type { Anime } from "@/features/anime/types";
import { AnimeCard } from "@/features/anime/components/anime-card";
import { useViewer } from "@/features/profiles/hooks";
import { demoActions, useDemoState } from "@/features/demo/store";
import { getAnimeByIdSync, getEpisodesSync } from "@/lib/data/anime";

export function MyAnimeView() {
  const { viewer, hydrated } = useViewer();
  const { watchedEpisodeIds } = useDemoState();
  const favorites = useMemo(
    () =>
      (viewer?.favoriteAnimeIds ?? [])
        .map((id) => getAnimeByIdSync(id))
        .filter((anime): anime is Anime => anime !== undefined),
    [viewer],
  );

  return (
    <PageContainer>
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          Meine Anime
        </h1>
        <p className="mt-1 text-muted-foreground">
          Deine Favoriten und dein Fortschritt.
        </p>
      </header>

      <div className="mt-6">
        {!hydrated ? (
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-6"
            aria-busy="true"
            aria-label="Wird geladen"
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        ) : !viewer ? (
          <EmptyState
            icon={LogInIcon}
            title="Melde dich an, um Favoriten zu speichern"
            action={{
              label: "Mit Demo-Konto anmelden",
              onClick: () => demoActions.signIn(),
            }}
          />
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={HeartIcon}
            title="Noch keine Favoriten"
            description="Tippe auf das Herz bei einer Serie, um sie hier und auf deinem Dashboard zu sehen."
            action={{ label: "Anime entdecken", href: "/anime" }}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {favorites.map((anime) => {
              const total = getEpisodesSync(anime.id).length;
              const watched = watchedEpisodeIds.filter((id) =>
                id.startsWith(`${anime.slug}-`),
              ).length;
              return (
                <li key={anime.id}>
                  <AnimeCard anime={anime} />
                  {total > 0 && (
                    <div className="mt-2">
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, (watched / total) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {watched} von {total} Episoden als gesehen markiert
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
