"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  FlaskConicalIcon,
  PlusIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { primaryNav } from "@/components/layout/nav-config";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import { isModerator, useDemoState } from "@/features/demo/store";
import { getAnimeByIdSync } from "@/lib/data/anime";
import { cn } from "@/lib/utils";

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="space-y-1">
      {primaryNav.map((item) => {
        const active = pathname ? item.match(pathname) : false;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-[0.9375rem] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                active &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function FavoriteList({ pathname }: { pathname: string | null }) {
  const { favorites, session, hydrated } = useDemoState();
  const items = favorites
    .map((id) => getAnimeByIdSync(id))
    .filter((anime) => anime !== undefined)
    .slice(0, 6);

  if (!hydrated) {
    return (
      <ul className="space-y-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex h-11 items-center gap-3 px-3">
            <span className="size-8 animate-pulse rounded-sm bg-muted" />
            <span className="h-3 w-24 animate-pulse rounded-sm bg-muted" />
          </li>
        ))}
      </ul>
    );
  }

  if (!session || items.length === 0) {
    return (
      <p className="px-3 text-sm text-muted-foreground">
        {session
          ? "Noch keine Favoriten."
          : "Melde dich an, um Favoriten zu sehen."}{" "}
        <Link
          href="/anime"
          className="font-semibold text-brand hover:underline"
        >
          Anime entdecken
        </Link>
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {items.map((anime) => {
        const href = `/anime/${anime.slug}`;
        const active = pathname?.startsWith(href) ?? false;
        return (
          <li key={anime.id}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
                active && "bg-accent text-foreground",
              )}
            >
              <AnimeCover
                anime={anime}
                aspect="square"
                className="size-8 shrink-0 rounded-sm"
              />
              <span className="truncate">{anime.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SecondaryLinks({ pathname }: { pathname: string | null }) {
  const { session, reports } = useDemoState();
  if (!session) return <div className="mt-auto" />;
  const moderator = isModerator(session.userId);
  const open = reports.filter((report) => report.status === "open").length;
  const links = [
    {
      href: "/settings/profile",
      match: "/settings",
      label: "Einstellungen",
      icon: SettingsIcon,
    },
    ...(moderator
      ? [
          {
            href: "/moderation",
            match: "/moderation",
            label: "Moderation",
            icon: ShieldCheckIcon,
          },
        ]
      : []),
  ];
  return (
    <nav aria-label="Konto" className="mt-auto">
      <ul className="space-y-1">
        {links.map((link) => {
          const active = pathname?.startsWith(link.match) ?? false;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground",
                  active && "bg-accent text-foreground",
                )}
              >
                <link.icon className="size-5" aria-hidden="true" />
                <span className="flex-1">{link.label}</span>
                {link.href === "/moderation" && open > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground tabular">
                    <span className="sr-only">offene Meldungen: </span>
                    {open}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActiveSecondaryLinks() {
  return <SecondaryLinks pathname={usePathname()} />;
}

function ActiveFavoriteList() {
  return <FavoriteList pathname={usePathname()} />;
}

export function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Link
        href="/dashboard"
        className="self-start rounded-md px-3 py-1"
        aria-label="ANIMORA – zum Dashboard"
      >
        <Logo />
      </Link>

      <nav aria-label="Hauptnavigation">
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
      </nav>

      <nav aria-labelledby="sidebar-favorites" className="space-y-2">
        <div className="flex items-center justify-between px-3">
          <h2
            id="sidebar-favorites"
            className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
          >
            Meine Anime
          </h2>
          <Link
            href="/anime"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Anime hinzufügen"
          >
            <PlusIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <Suspense fallback={<FavoriteList pathname={null} />}>
          <ActiveFavoriteList />
        </Suspense>
      </nav>

      <Suspense fallback={<SecondaryLinks pathname={null} />}>
        <ActiveSecondaryLinks />
      </Suspense>

      <div className="rounded-md border border-dashed px-3 py-3 text-xs leading-relaxed text-muted-foreground">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <FlaskConicalIcon
            className="size-3.5 text-brand"
            aria-hidden="true"
          />
          Demo-Modus
        </p>
        <p className="mt-1">
          Inhalte, Termine und Konten sind Beispieldaten. Änderungen bleiben nur
          in diesem Browser.
        </p>
      </div>
    </div>
  );
}
