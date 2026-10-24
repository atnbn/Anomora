import Link from "next/link";
import { StarIcon } from "lucide-react";
import type { Anime } from "@/features/anime/types";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import { FavoriteToggle } from "@/features/anime/components/favorite-button";
import { statusLabel } from "@/features/anime/labels";
import { cn } from "@/lib/utils";

/** Poster-Karte für Raster und horizontale Listen. */
export function AnimeCard({
  anime,
  className,
  showFavorite = true,
  priority,
}: {
  anime: Anime;
  className?: string;
  showFavorite?: boolean;
  priority?: boolean;
}) {
  return (
    <article className={cn("group relative min-w-0", className)}>
      <div className="relative">
        <AnimeCover
          anime={anime}
          showTitle
          priority={priority}
          className="transition-transform duration-200 ease-out-soft group-hover:-translate-y-0.5"
        />
        {anime.status === "airing" && (
          <span className="absolute top-2 left-2 rounded-sm bg-black/60 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white backdrop-blur-sm">
            Läuft
          </span>
        )}
        {showFavorite && (
          <FavoriteToggle
            anime={anime}
            className="absolute top-1.5 right-1.5 z-10"
          />
        )}
      </div>
      <h3 className="mt-2.5 line-clamp-2 text-sm leading-snug font-semibold">
        <Link
          href={`/anime/${anime.slug}`}
          className="rounded-sm after:absolute after:inset-0 after:content-[''] hover:text-brand"
        >
          {anime.title}
        </Link>
      </h3>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{anime.year}</span>
        <span aria-hidden="true">·</span>
        <span className="truncate">{statusLabel[anime.status]}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-0.5">
          <StarIcon
            className="size-3 fill-current text-warning"
            aria-hidden="true"
          />
          <span className="sr-only">Bewertung</span>
          {anime.score}
        </span>
      </p>
    </article>
  );
}
