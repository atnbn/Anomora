"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Loader2Icon, SearchIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import type { Anime, AnimeSort, AnimeStatus } from "@/features/anime/types";
import { AnimeCard } from "@/features/anime/components/anime-card";
import { AniListCredit } from "@/features/anime/components/anilist-credit";
import {
  searchAnime,
  useAnimeSearch,
  useDebouncedValue,
} from "@/features/anime/anime-cache";
import { GENRE_OPTIONS } from "@/features/anime/genres";
import { sortLabel, statusLabel } from "@/features/anime/labels";
import { listAnimeSync } from "@/lib/data/anime";

const fieldClass =
  "h-10 w-full rounded-md border bg-background px-3 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

/** Unter zwei Zeichen wird nicht gesucht – spart unnötige Anfragen. */
const MIN_SEARCH = 2;

function ResultGrid({ items }: { items: Anime[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {items.map((anime, index) => (
        <li key={anime.id}>
          <AnimeCard anime={anime} priority={index < 6} />
        </li>
      ))}
    </ul>
  );
}

function GridSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="Ergebnisse werden geladen"
      className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <li key={index} className="space-y-2">
          <Skeleton className="aspect-[3/4] rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </li>
      ))}
    </ul>
  );
}

export function DiscoverView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(search.trim());
  const genre = searchParams.get("genre") ?? "";
  const status = (searchParams.get("status") ?? "") as AnimeStatus | "";
  const sort = (searchParams.get("sort") ?? "popular") as AnimeSort;

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  // Suchbegriff verzögert in die URL schreiben, damit Links teilbar bleiben.
  useEffect(() => {
    if ((searchParams.get("q") ?? "") !== debouncedSearch)
      update("q", debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const tooShort =
    debouncedSearch.length > 0 && debouncedSearch.length < MIN_SEARCH;
  const params = useMemo(
    () =>
      tooShort
        ? null
        : {
            search: debouncedSearch || undefined,
            genre: genre || undefined,
            status: status || undefined,
            sort,
          },
    [tooShort, debouncedSearch, genre, status, sort],
  );
  const firstPage = useAnimeSearch(params);

  // Weitere Seiten werden angehängt; jede Seite liegt einzeln im Cache.
  const [more, setMore] = useState<{
    key: string;
    items: Anime[];
    page: number;
    hasNext: boolean;
  }>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const paramsKey = JSON.stringify(params);
  const extra = more?.key === paramsKey ? more : undefined;

  const items =
    firstPage.status === "success"
      ? [...firstPage.result.items, ...(extra?.items ?? [])]
      : [];
  const hasNext =
    firstPage.status === "success" &&
    (extra ? extra.hasNext : firstPage.result.hasNextPage);
  const total = firstPage.status === "success" ? firstPage.result.total : 0;

  async function loadMore() {
    if (!params) return;
    const page = (extra?.page ?? 1) + 1;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const result = await searchAnime({ ...params, page });
      setMore({
        key: paramsKey,
        items: [...(extra?.items ?? []), ...result.items],
        page,
        hasNext: result.hasNextPage,
      });
    } catch (error) {
      setMoreError((error as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  const hasFilters = Boolean(search || genre || status);
  const fallback =
    firstPage.status === "error"
      ? listAnimeSync({
          search: debouncedSearch,
          genre: genre || undefined,
          status: status || undefined,
          sort,
        })
      : [];

  function reset() {
    setSearch("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <PageContainer>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
            Entdecken
          </h1>
          <p className="mt-1 text-muted-foreground">
            Durchsuche den kompletten Anime-Katalog von AniList und favorisiere
            Serien für dein Dashboard.
          </p>
        </div>
        <AniListCredit />
      </header>

      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="mt-6 grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]"
      >
        <div className="grid gap-1 sm:col-span-2 lg:col-span-1">
          <label
            htmlFor="discover-search"
            className="text-xs font-semibold text-muted-foreground"
          >
            Suche
          </label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="discover-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titel, auch englisch oder japanisch"
              aria-describedby={tooShort ? "discover-search-hint" : undefined}
              className={`${fieldClass} pl-9`}
            />
          </div>
          {tooShort && (
            <p
              id="discover-search-hint"
              className="text-xs text-muted-foreground"
            >
              Mindestens {MIN_SEARCH} Zeichen eingeben.
            </p>
          )}
        </div>
        <div className="grid gap-1">
          <label
            htmlFor="discover-genre"
            className="text-xs font-semibold text-muted-foreground"
          >
            Genre
          </label>
          <select
            id="discover-genre"
            value={genre}
            onChange={(event) => update("genre", event.target.value)}
            className={fieldClass}
          >
            <option value="">Alle Genres</option>
            {GENRE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label
            htmlFor="discover-status"
            className="text-xs font-semibold text-muted-foreground"
          >
            Status
          </label>
          <select
            id="discover-status"
            value={status}
            onChange={(event) => update("status", event.target.value)}
            className={fieldClass}
          >
            <option value="">Alle</option>
            {(Object.keys(statusLabel) as AnimeStatus[]).map((option) => (
              <option key={option} value={option}>
                {statusLabel[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label
            htmlFor="discover-sort"
            className="text-xs font-semibold text-muted-foreground"
          >
            Sortierung
          </label>
          <select
            id="discover-sort"
            value={sort}
            onChange={(event) => update("sort", event.target.value)}
            className={fieldClass}
          >
            {(Object.keys(sortLabel) as AnimeSort[]).map((option) => (
              <option key={option} value={option}>
                {sortLabel[option]}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {firstPage.status === "loading" && "Suche läuft …"}
          {firstPage.status === "success" &&
            `${total.toLocaleString("de-DE")} ${total === 1 ? "Ergebnis" : "Ergebnisse"}`}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md px-2 py-1 text-sm font-semibold text-brand hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      <div className="mt-4">
        {firstPage.status === "error" ? (
          <div className="space-y-8">
            <ErrorState
              title="AniList ist gerade nicht erreichbar"
              description={firstPage.error.message}
              onRetry={firstPage.error.retryable ? firstPage.retry : undefined}
            />
            {fallback.length > 0 && (
              <section aria-labelledby="fallback-title" className="space-y-4">
                <h2 id="fallback-title" className="font-bold">
                  Aus dem ANIMORA-Katalog
                </h2>
                <ResultGrid items={fallback} />
              </section>
            )}
          </div>
        ) : firstPage.status === "success" ? (
          items.length === 0 ? (
            <EmptyState
              icon={SearchXIcon}
              title="Keine Anime gefunden"
              description="Versuche einen anderen Suchbegriff oder entferne einen Filter."
              action={{ label: "Filter zurücksetzen", onClick: reset }}
            />
          ) : (
            <>
              <ResultGrid items={items} />
              {moreError && (
                <p
                  role="alert"
                  className="mt-6 text-center text-sm font-medium text-destructive"
                >
                  {moreError}
                </p>
              )}
              {hasNext && (
                <Button
                  variant="outline"
                  className="mt-8 w-full"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore && (
                    <Loader2Icon className="animate-spin" aria-hidden="true" />
                  )}
                  Weitere Anime laden
                </Button>
              )}
            </>
          )
        ) : (
          !tooShort && <GridSkeleton />
        )}
      </div>
    </PageContainer>
  );
}
