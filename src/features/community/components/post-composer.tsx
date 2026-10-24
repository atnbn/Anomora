"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Post, PostCategory, PostMedia } from "@/features/community/types";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { useViewer } from "@/features/profiles/hooks";
import { demoActions, requireCanPost } from "@/features/demo/store";
import { getAnimeByIdSync, listAnimeSync } from "@/lib/data/anime";
import { cn } from "@/lib/utils";

export const MAX_POST_LENGTH = 1000;

export const categoryLabel: Record<PostCategory, string> = {
  discussion: "Diskussion",
  fanart: "Fanart",
  cosplay: "Cosplay",
  news: "News",
  collection: "Sammlung",
};

const selectClass =
  "h-10 min-w-0 rounded-md border bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

/** Beitrag erstellen. Im Demo-Modus können statt Fotos Demo-Artworks angehängt werden. */
export function PostComposer({
  defaultAnimeId,
  onCreated,
  autoFocus,
  className,
}: {
  defaultAnimeId?: string;
  onCreated?: (post: Post) => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const id = useId();
  const { viewer } = useViewer();
  const [body, setBody] = useState("");
  const [animeId, setAnimeId] = useState(defaultAnimeId ?? "");
  const [category, setCategory] = useState<PostCategory>("discussion");
  const [spoiler, setSpoiler] = useState(false);
  const [media, setMedia] = useState<PostMedia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(Boolean(autoFocus));

  const remaining = MAX_POST_LENGTH - body.length;
  const anime = animeId ? getAnimeByIdSync(animeId) : undefined;

  function addArtwork() {
    if (!anime) {
      setError(
        "Wähle zuerst einen Anime aus – das Demo-Artwork basiert auf seinem Cover.",
      );
      return;
    }
    if (media.length >= 3) return;
    setError(null);
    setMedia((current) => [
      ...current,
      {
        kind: "anime-art",
        animeId: anime.id,
        variant: current.length + 5,
        alt: `Demo-Artwork im Stil von ${anime.title}`,
      },
    ]);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!requireCanPost("Melde dich an, um Beiträge zu veröffentlichen."))
      return;
    const text = body.trim();
    if (text.length < 3) {
      setError("Dein Beitrag braucht mindestens 3 Zeichen.");
      return;
    }
    if (text.length > MAX_POST_LENGTH) {
      setError(
        `Dein Beitrag ist ${text.length - MAX_POST_LENGTH} Zeichen zu lang.`,
      );
      return;
    }
    const post = demoActions.createPost({
      body: text,
      animeId: animeId || undefined,
      category,
      containsSpoiler: spoiler,
      media: media.filter((item) => item.animeId === animeId),
    });
    if (!post) return;
    setBody("");
    setMedia([]);
    setSpoiler(false);
    setError(null);
    setExpanded(false);
    toast.success("Beitrag veröffentlicht");
    onCreated?.(post);
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={cn("rounded-lg border bg-card p-3 sm:p-4", className)}
      aria-label="Neuen Beitrag erstellen"
    >
      <div className="flex gap-3">
        <UserAvatar
          user={viewer ?? undefined}
          size="md"
          className="hidden sm:inline-flex"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-body`} className="sr-only">
            Beitragstext
          </label>
          <textarea
            id={`${id}-body`}
            value={body}
            autoFocus={autoFocus}
            onFocus={() => setExpanded(true)}
            onChange={(event) => {
              setBody(event.target.value);
              if (error) setError(null);
            }}
            rows={expanded ? 4 : 2}
            placeholder={
              viewer
                ? "Was beschäftigt dich gerade?"
                : "Melde dich an, um mitzureden"
            }
            aria-invalid={error ? true : undefined}
            aria-describedby={`${id}-count${error ? ` ${id}-error` : ""}`}
            className="block w-full resize-none rounded-md border border-transparent bg-muted px-3 py-2.5 text-[0.9375rem] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background"
          />

          {media.length > 0 && (
            <ul
              className="mt-3 flex gap-2"
              aria-label="Angehängte Demo-Artworks"
            >
              {media.map((item, index) => {
                const source = getAnimeByIdSync(item.animeId);
                return (
                  <li
                    key={`${item.animeId}-${item.variant}`}
                    className="relative"
                  >
                    {source && (
                      <AnimeCover
                        anime={source}
                        variant={item.variant}
                        preferArt
                        aspect="square"
                        className="size-20"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setMedia((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={`Artwork ${index + 1} entfernen`}
                      className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border bg-popover shadow-sm hover:bg-accent"
                    >
                      <XIcon className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {expanded && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <label
                  htmlFor={`${id}-anime`}
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Anime (optional)
                </label>
                <select
                  id={`${id}-anime`}
                  value={animeId}
                  onChange={(event) => {
                    setAnimeId(event.target.value);
                    setMedia([]);
                  }}
                  className={selectClass}
                >
                  <option value="">Kein Anime</option>
                  {listAnimeSync({ sort: "title" }).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label
                  htmlFor={`${id}-category`}
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Kategorie
                </label>
                <select
                  id={`${id}-category`}
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as PostCategory)
                  }
                  className={selectClass}
                >
                  {(Object.keys(categoryLabel) as PostCategory[])
                    .filter((value) => value !== "news")
                    .map((value) => (
                      <option key={value} value={value}>
                        {categoryLabel[value]}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <p
              id={`${id}-error`}
              role="alert"
              className="mt-2 text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setExpanded(true);
                addArtwork();
              }}
              disabled={media.length >= 3}
              className="text-muted-foreground"
            >
              <ImagePlusIcon aria-hidden="true" />
              Bild
              <span className="sr-only">(Demo-Artwork anhängen)</span>
            </Button>
            <label className="flex min-h-9 items-center gap-2 text-sm font-medium text-muted-foreground">
              <Switch
                checked={spoiler}
                onCheckedChange={(checked) => setSpoiler(checked)}
              />
              Spoiler
            </label>
            <span
              id={`${id}-count`}
              className={cn(
                "ml-auto text-xs tabular text-muted-foreground",
                remaining < 0 && "font-semibold text-destructive",
              )}
            >
              {remaining < 100 ? (
                `${remaining} Zeichen übrig`
              ) : (
                <span className="sr-only">
                  Maximal {MAX_POST_LENGTH} Zeichen
                </span>
              )}
            </span>
            <Button type="submit" disabled={body.trim().length === 0}>
              Posten
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
