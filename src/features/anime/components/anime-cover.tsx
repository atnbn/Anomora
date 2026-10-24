import Image from "next/image";
import { ImageOffIcon } from "lucide-react";
import type { Anime } from "@/features/anime/types";
import { AnimeArtwork } from "@/features/anime/components/anime-artwork";
import { cn } from "@/lib/utils";

type CoverAnime = Pick<Anime, "id" | "title" | "art" | "coverUrl">;

const aspectClass = {
  poster: "aspect-[3/4]",
  wide: "aspect-[16/9]",
  square: "aspect-square",
  fill: "h-full w-full",
} as const;

/**
 * Cover eines Anime: echtes Bild (sobald eine API angebunden ist),
 * sonst generiertes Demo-Artwork, sonst ein neutraler Platzhalter.
 */
export function AnimeCover({
  anime,
  variant = 0,
  aspect = "poster",
  showTitle = false,
  sizes = "(min-width: 1024px) 200px, 40vw",
  priority = false,
  className,
}: {
  anime: CoverAnime;
  variant?: number;
  aspect?: keyof typeof aspectClass;
  showTitle?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-lg bg-muted",
        aspectClass[aspect],
        className,
      )}
    >
      {anime.coverUrl ? (
        <Image
          src={anime.coverUrl}
          alt={`Cover von ${anime.title}`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          unoptimized
        />
      ) : anime.art ? (
        <AnimeArtwork
          art={anime.art}
          seed={`${anime.id}-${variant}`}
          className="absolute inset-0 size-full"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
          <ImageOffIcon className="size-6" aria-hidden="true" />
          <span className="text-xs font-medium">Kein Cover</span>
        </div>
      )}

      {showTitle && (anime.art || anime.coverUrl) && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/75 to-transparent"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-2.5 bottom-2 line-clamp-2 font-display text-[1.05rem] leading-[1.05] font-bold tracking-wide text-white uppercase"
          >
            {anime.title}
          </span>
        </>
      )}
    </div>
  );
}
