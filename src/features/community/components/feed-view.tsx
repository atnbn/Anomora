"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  HashIcon,
  PlusIcon,
  SearchXIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { FeedSkeleton } from "@/components/feedback/skeletons";
import { PageContainer } from "@/components/layout/app-shell";
import { Panel } from "@/components/layout/section";
import type { FeedFilter } from "@/features/community/types";
import { filterPosts, usePosts } from "@/features/community/hooks";
import { PostCard } from "@/features/community/components/post-card";
import { PostComposer } from "@/features/community/components/post-composer";
import { SuggestedUsersPanel } from "@/features/community/components/community-rail";
import { useDemoState } from "@/features/demo/store";
import { getAnimeByIdSync, getAnimeBySlugSync } from "@/lib/data/anime";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

const filters: { value: FeedFilter; label: string }[] = [
  { value: "all", label: "Alle Beiträge" },
  { value: "following", label: "Folge ich" },
  { value: "popular", label: "Beliebt" },
  { value: "discussion", label: "Diskussionen" },
  { value: "fanart", label: "Fanart" },
  { value: "cosplay", label: "Cosplay" },
];

function TrendingPanel() {
  const posts = usePosts();
  const trending = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      if (post.animeId)
        counts.set(
          post.animeId,
          (counts.get(post.animeId) ?? 0) + 1 + post.commentCount,
        );
    }
    return [...counts.entries()]
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([animeId, score]) => ({ anime: getAnimeByIdSync(animeId), score }))
      .filter((entry) => entry.anime !== undefined);
  }, [posts]);

  return (
    <Panel as="section" labelledBy="trending" className="p-2">
      <h2 id="trending" className="px-2 pt-2 pb-1 text-[0.9375rem] font-bold">
        Trendende Themen
      </h2>
      <ol>
        {trending.map(({ anime, score }, index) => (
          <li key={anime!.id}>
            <Link
              href={`/community?anime=${anime!.slug}`}
              className="flex min-h-12 items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-bold tabular">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {anime!.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {formatCount(score)} Aktivitäten
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function FeedView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const posts = usePosts();
  const { following, hydrated, session } = useDemoState();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [composerOpen, setComposerOpen] = useState(false);
  const [retried, setRetried] = useState(false);

  const animeSlug = searchParams.get("anime");
  const anime = animeSlug ? getAnimeBySlugSync(animeSlug) : undefined;
  // Zum Vorführen der Zustände: /community?simulate=error oder ?simulate=loading
  const simulate = searchParams.get("simulate");

  const result = useMemo(() => {
    const scoped = anime
      ? posts.filter((post) => post.animeId === anime.id)
      : posts;
    return filterPosts(scoped, filter, following);
  }, [posts, filter, following, anime]);

  function selectFilter(value: FeedFilter) {
    setFilter(value);
    setVisible(PAGE_SIZE);
  }

  let content: React.ReactNode;
  if (!hydrated || simulate === "loading") {
    content = <FeedSkeleton />;
  } else if (simulate === "error" && !retried) {
    content = <ErrorState onRetry={() => setRetried(true)} />;
  } else if (result.length === 0) {
    content =
      filter === "following" ? (
        <EmptyState
          icon={UsersIcon}
          title={
            session
              ? "Noch nichts von Leuten, denen du folgst"
              : "Melde dich an, um anderen zu folgen"
          }
          description="Folge Mitgliedern, deren Beiträge dich interessieren – sie erscheinen dann hier."
          action={{
            label: "Alle Beiträge ansehen",
            onClick: () => selectFilter("all"),
          }}
        />
      ) : (
        <EmptyState
          icon={SearchXIcon}
          title="Keine Beiträge gefunden"
          description={
            anime
              ? `Zu ${anime.title} gibt es in dieser Kategorie noch keine Beiträge.`
              : "In dieser Kategorie gibt es noch keine Beiträge."
          }
          action={{
            label: "Filter zurücksetzen",
            onClick: () => {
              selectFilter("all");
              router.push("/community");
            },
          }}
        />
      );
  } else {
    content = (
      <>
        <ul className="space-y-4">
          {result.slice(0, visible).map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
        {result.length > visible ? (
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => setVisible((value) => value + PAGE_SIZE)}
          >
            Weitere Beiträge laden
          </Button>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Du bist auf dem neuesten Stand.
          </p>
        )}
      </>
    );
  }

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                Community
              </h1>
              <p className="mt-1 text-muted-foreground">
                Theorien, Fanart, Cosplay und alles dazwischen.
              </p>
            </div>
          </header>

          <PostComposer
            className="hidden sm:block"
            defaultAnimeId={anime?.id}
          />
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex h-12 w-full items-center gap-3 rounded-lg border bg-card px-4 text-left text-muted-foreground sm:hidden"
          >
            <PlusIcon className="size-5 text-brand" aria-hidden="true" />
            Was beschäftigt dich gerade?
          </button>

          {anime && (
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
              <HashIcon className="size-4 text-brand" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                Beiträge zu <span className="font-semibold">{anime.title}</span>
              </span>
              <Link
                href="/community"
                aria-label="Anime-Filter entfernen"
                className="flex size-8 items-center justify-center rounded-full hover:bg-accent"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}

          <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
            <div
              role="group"
              aria-label="Beiträge filtern"
              className="flex w-max gap-1.5"
            >
              {filters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => selectFilter(option.value)}
                  className={cn(
                    "h-10 rounded-full border px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    filter === option.value &&
                      "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div aria-live="polite">{content}</div>
        </div>

        <aside className="space-y-4" aria-label="Trends und Vorschläge">
          <TrendingPanel />
          <SuggestedUsersPanel />
        </aside>
      </div>

      <Button
        size="icon-lg"
        aria-label="Neuen Beitrag erstellen"
        onClick={() => setComposerOpen(true)}
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg sm:hidden"
      >
        <PlusIcon className="size-6" aria-hidden="true" />
      </Button>
      <Sheet open={composerOpen} onOpenChange={setComposerOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] overflow-y-auto rounded-t-xl pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="pb-0">
            <SheetTitle className="text-lg font-bold">Neuer Beitrag</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <PostComposer
              autoFocus
              defaultAnimeId={anime?.id}
              className="border-0 p-0"
              onCreated={() => setComposerOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
