"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { UserIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { GlobalSearch } from "@/components/layout/global-search";
import { primaryNav } from "@/components/layout/nav-config";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { BanBanner } from "@/features/moderation/ban-banner";
import { profileHref } from "@/features/profiles/components/user-name";
import { useViewer } from "@/features/profiles/hooks";
import { cn } from "@/lib/utils";

function BottomNavLinks({ pathname }: { pathname: string | null }) {
  const { viewer } = useViewer();
  const profilePath = viewer ? profileHref(viewer) : null;
  const items = [
    ...primaryNav.map((item) => ({
      ...item,
      label: item.shortLabel ?? item.label,
      active: pathname ? item.match(pathname) : false,
    })),
    {
      href: profilePath ?? "/u/StrawHatMax",
      label: "Profil",
      icon: UserIcon,
      active:
        pathname !== null && profilePath !== null && pathname === profilePath,
    },
  ];

  return (
    <ul className="grid grid-cols-5">
      {items.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold text-muted-foreground",
              item.active && "text-brand",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                item.active && "bg-brand-soft",
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ActiveBottomNavLinks() {
  return <BottomNavLinks pathname={usePathname()} />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Zum Inhalt springen
      </a>

      <aside className="sticky top-0 hidden h-dvh border-r bg-surface lg:block">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
          <div className="mx-auto flex h-16 max-w-[77.5rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link
              href="/dashboard"
              className="rounded-md lg:hidden"
              aria-label="ANIMORA – zum Dashboard"
            >
              <Logo />
            </Link>
            <div className="hidden flex-1 lg:block">
              <GlobalSearch variant="field" />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="lg:hidden">
                <GlobalSearch variant="icon" />
              </div>
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 pb-24 outline-none lg:pb-12"
        >
          <BanBanner />
          {children}
        </main>
      </div>

      <nav
        aria-label="Hauptnavigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <Suspense fallback={<BottomNavLinks pathname={null} />}>
          <ActiveBottomNavLinks />
        </Suspense>
      </nav>
    </div>
  );
}

/** Einheitlicher Seitenrahmen mit Inhaltsbreite und Abständen. */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[77.5rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
