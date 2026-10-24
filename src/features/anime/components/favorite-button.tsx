"use client";

import { HeartIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Anime } from "@/features/anime/types";
import {
  demoActions,
  requireSession,
  useDemoState,
} from "@/features/demo/store";
import { cn } from "@/lib/utils";

export function useIsFavorite(animeId: string) {
  const { favorites, session } = useDemoState();
  return Boolean(session) && favorites.includes(animeId);
}

function toggleFavorite(
  anime: Pick<Anime, "id" | "title">,
  isFavorite: boolean,
) {
  if (
    !requireSession("Melde dich an, um Anime zu deinen Favoriten hinzuzufügen.")
  )
    return;
  demoActions.toggleFavorite(anime.id);
  toast.success(
    isFavorite ? "Aus Favoriten entfernt" : "Zu Favoriten hinzugefügt",
    {
      description: anime.title,
      action: {
        label: "Rückgängig",
        onClick: () => demoActions.toggleFavorite(anime.id),
      },
    },
  );
}

/** Großer Button für Detailseiten. */
export function FavoriteButton({
  anime,
  className,
}: {
  anime: Pick<Anime, "id" | "title">;
  className?: string;
}) {
  const isFavorite = useIsFavorite(anime.id);
  return (
    <Button
      size="lg"
      variant={isFavorite ? "outline" : "default"}
      aria-pressed={isFavorite}
      onClick={() => toggleFavorite(anime, isFavorite)}
      className={className}
    >
      <HeartIcon
        className={cn(isFavorite && "fill-current text-brand")}
        aria-hidden="true"
      />
      {isFavorite ? "Favorisiert" : "Zu Favoriten"}
    </Button>
  );
}

/** Kompaktes Herz für Karten und Listen. */
export function FavoriteToggle({
  anime,
  className,
}: {
  anime: Pick<Anime, "id" | "title">;
  className?: string;
}) {
  const isFavorite = useIsFavorite(anime.id);
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? `${anime.title} aus Favoriten entfernen`
          : `${anime.title} favorisieren`
      }
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(anime, isFavorite);
      }}
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70",
        className,
      )}
    >
      <HeartIcon
        className={cn(
          "size-[1.125rem]",
          isFavorite && "fill-[var(--brand)] text-[var(--brand)]",
        )}
        aria-hidden="true"
      />
    </button>
  );
}
