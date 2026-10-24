import Image from "next/image";
import { ImageOffIcon } from "lucide-react";
import type { Anime } from "@/features/anime/types";
import { AnimeArtwork } from "@/features/anime/components/anime-artwork";
import { cn } from "@/lib/utils";

type CoverAnime = Pick<
  Anime,
  "id" | "title" | "art" | "coverUrl" | "coverColor"
>;

const aspectClass = {
  poster: "aspect-[3/4]",
  wide: "aspect-[16/9]",
  square: "aspect-square",
  fill: "h-full w-full",
} as const;

/**
 * Cover eines Anime: Bild von AniList, sonst generiertes Demo-Artwork,
 * sonst ein neutraler Platzhalter.
 *
 * `preferArt` erzwingt das Demo-Artwork – für Beitragsbilder, damit offizielle
 * Cover nicht wie Fotos von Nutzerinnen und Nutzern wirken.
 * Standardmäßig dekorativ (`alt=""`), weil der Titel daneben steht.
 */
export function AnimeCover({
  anime,
  variant = 0,
  aspect = "poster",
  showTitle = false,
  preferArt = false,
  alt = "",
  sizes = "(min-width: 1024px) 200px, 40vw",
  priority = false,
  className,
}: {
  anime: CoverAnime;
  variant?: number;
  aspect?: keyof typeof aspectClass;
  showTitle?: boolean;
  preferArt?: boolean;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const useArt = Boolean(anime.art) && (preferArt || !anime.coverUrl);
  const useImage = !useArt && Boolean(anime.coverUrl);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-lg bg-muted",
        aspectClass[aspect],
        className,
      )}
      style={
        useImage && anime.coverColor
          ? { backgroundColor: anime.coverColor }
          : undefined
      }
    >
      {useImage ? (
        <Image
          src={anime.coverUrl!}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          unoptimized
        />
      ) : useArt ? (
        <AnimeArtwork
          art={anime.art!}
          seed={`${anime.id}-${variant}`}
          className="absolute inset-0 size-full"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
          <ImageOffIcon className="size-6" aria-hidden="true" />
          <span className="text-xs font-medium">Kein Cover</span>
        </div>
      )}

      {/* Echte Cover tragen den Titel bereits – nur das Demo-Artwork bekommt ihn eingeblendet. */}
      {showTitle && useArt && (
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

/**
 * Breiter Hintergrund für Heros und Banner: AniList-Banner, sonst das Cover
 * unscharf vergrößert, sonst Demo-Artwork.
 */
export function AnimeBackdrop({
  anime,
  seed,
  className,
  priority = false,
}: {
  anime: Pick<Anime, "id" | "art" | "coverUrl" | "bannerUrl" | "coverColor">;
  seed: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden bg-muted", className)}
      style={
        anime.coverColor ? { backgroundColor: anime.coverColor } : undefined
      }
    >
      {anime.bannerUrl ? (
        <Image
          src={anime.bannerUrl}
          alt=""
          fill
          sizes="100vw"
          priority={priority}
          className="object-cover"
          unoptimized
        />
      ) : anime.coverUrl ? (
        <Image
          src={anime.coverUrl}
          alt=""
          fill
          sizes="100vw"
          priority={priority}
          className="scale-125 object-cover blur-2xl"
          unoptimized
        />
      ) : anime.art ? (
        <AnimeArtwork art={anime.art} seed={seed} className="size-full" />
      ) : null}
    </div>
  );
}
