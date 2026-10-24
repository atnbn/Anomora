"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FileTextIcon, SearchIcon, SearchXIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { profileHref } from "@/features/profiles/components/user-name";
import { usePosts } from "@/features/community/hooks";
import { listAnimeSync } from "@/lib/data/anime";
import { getUserByIdSync, listUsersSync } from "@/lib/data/users";
import { cn } from "@/lib/utils";

type Result = { href: string; key: string; node: React.ReactNode };

export function GlobalSearch({ variant }: { variant: "field" | "icon" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLocaleLowerCase("de"));
  const posts = usePosts();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, [contenteditable=true]");
      if (
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing)
      ) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const groups = useMemo(() => {
    if (!deferred) return null;
    const anime: Result[] = listAnimeSync({ search: deferred })
      .slice(0, 5)
      .map((item) => ({
        key: item.id,
        href: `/anime/${item.slug}`,
        node: (
          <>
            <AnimeCover
              anime={item}
              aspect="poster"
              className="w-9 shrink-0 rounded-sm"
            />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{item.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {item.year} · {item.genres.slice(0, 2).join(", ")}
              </span>
            </span>
          </>
        ),
      }));
    const users: Result[] = listUsersSync()
      .filter((user) =>
        `${user.username} ${user.displayName}`
          .toLocaleLowerCase("de")
          .includes(deferred),
      )
      .slice(0, 4)
      .map((user) => ({
        key: user.id,
        href: profileHref(user),
        node: (
          <>
            <UserAvatar user={user} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">
                {user.username}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.displayName}
              </span>
            </span>
          </>
        ),
      }));
    const postResults: Result[] = posts
      .filter(
        (post) =>
          !post.containsSpoiler &&
          post.body.toLocaleLowerCase("de").includes(deferred),
      )
      .slice(0, 4)
      .map((post) => ({
        key: post.id,
        href: `/community/posts/${post.id}`,
        node: (
          <>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-muted">
              <FileTextIcon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate">{post.body}</span>
              <span className="block truncate text-xs text-muted-foreground">
                von {getUserByIdSync(post.authorId)?.username ?? "Unbekannt"}
              </span>
            </span>
          </>
        ),
      }));
    return [
      { label: "Anime", results: anime },
      { label: "Nutzer", results: users },
      { label: "Beiträge", results: postResults },
    ].filter((group) => group.results.length > 0);
  }, [deferred, posts]);

  const first = groups?.[0]?.results[0];

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
    >
      {variant === "field" ? (
        <DialogTrigger className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-full border bg-card px-4 text-sm text-muted-foreground transition-colors hover:border-foreground/20">
          <SearchIcon className="size-4" aria-hidden="true" />
          <span className="flex-1 text-left">
            Anime, Nutzer oder Beiträge suchen
          </span>
          <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 font-sans text-[0.6875rem] font-semibold">
            Strg K
          </kbd>
        </DialogTrigger>
      ) : (
        <DialogTrigger
          aria-label="Suchen"
          className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-accent"
        >
          <SearchIcon className="size-5" aria-hidden="true" />
        </DialogTrigger>
      )}
      <DialogContent
        showCloseButton={false}
        className="top-4 max-h-[calc(100dvh-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:top-[12vh] sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Suche</DialogTitle>
        <form
          role="search"
          className="flex items-center gap-3 border-b px-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (first) {
              router.push(first.href);
              close();
            }
          }}
        >
          <SearchIcon
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="global-search" className="sr-only">
            Suchbegriff
          </label>
          <input
            id="global-search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Anime, Nutzer oder Beiträge suchen"
            autoComplete="off"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={close}
            className="rounded-md px-2 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Schließen
          </button>
        </form>

        <div className="max-h-[60dvh] overflow-y-auto p-2" aria-live="polite">
          {!groups && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Tippe, um im Katalog, in Profilen und Beiträgen zu suchen.
            </p>
          )}
          {groups && groups.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <SearchXIcon
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="font-semibold">
                Keine Treffer für „{query.trim()}“
              </p>
              <p className="text-sm text-muted-foreground">
                Prüfe die Schreibweise oder suche nach einem Genre wie
                „Fantasy“.
              </p>
            </div>
          )}
          {groups?.map((group) => (
            <div key={group.label} className="py-1">
              <p className="px-3 py-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </p>
              <ul>
                {group.results.map((result) => (
                  <li key={result.key}>
                    <Link
                      href={result.href}
                      onClick={close}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:bg-accent",
                        result === first && "bg-accent/60",
                      )}
                    >
                      {result.node}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="hidden border-t px-4 py-2 text-xs text-muted-foreground sm:block">
          Enter öffnet den ersten Treffer · Tab wechselt zwischen Treffern · Esc
          schließt
        </p>
      </DialogContent>
    </Dialog>
  );
}
