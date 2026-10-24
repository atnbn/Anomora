"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  BanIcon,
  LogInIcon,
  PaletteIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import type { UserProfile } from "@/features/profiles/types";
import { useViewer } from "@/features/profiles/hooks";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/settings/profile", label: "Profil", icon: UserIcon },
  { href: "/settings/account", label: "Konto & Sicherheit", icon: ShieldIcon },
  { href: "/settings/appearance", label: "Darstellung", icon: PaletteIcon },
  { href: "/settings/blocked", label: "Blockierte Nutzer", icon: BanIcon },
];

function SectionLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex gap-1.5 overflow-x-auto scrollbar-none lg:flex-col lg:gap-1">
      {sections.map((section) => {
        const active = pathname === section.href;
        return (
          <li key={section.href} className="shrink-0">
            <Link
              href={section.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-foreground lg:h-11 lg:rounded-md lg:border-0 lg:px-3",
                active &&
                  "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground lg:bg-accent lg:text-foreground lg:hover:bg-accent lg:hover:text-foreground",
              )}
            >
              <section.icon className="size-4" aria-hidden="true" />
              {section.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveSectionLinks() {
  return <SectionLinks pathname={usePathname()} />;
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
        Einstellungen
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <nav
          aria-label="Bereiche der Einstellungen"
          className="-mx-4 px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-24 lg:self-start"
        >
          <Suspense fallback={<SectionLinks pathname={null} />}>
            <ActiveSectionLinks />
          </Suspense>
        </nav>
        <div className="min-w-0 max-w-3xl">{children}</div>
      </div>
    </PageContainer>
  );
}

/** Rendert den Bereich nur mit Sitzung; sonst Lade- bzw. Anmeldezustand. */
export function RequireViewer({
  children,
}: {
  children: (viewer: UserProfile) => React.ReactNode;
}) {
  const { viewer, hydrated } = useViewer();
  if (!hydrated) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Wird geladen">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  if (!viewer) {
    return (
      <EmptyState
        icon={LogInIcon}
        title="Melde dich an, um deine Einstellungen zu ändern"
        action={{ label: "Anmelden", href: "/login?next=/settings/profile" }}
        secondaryAction={{ label: "Registrieren", href: "/register" }}
      />
    );
  }
  return <>{children(viewer)}</>;
}

export function SettingsSection({
  title,
  description,
  children,
  tone = "default",
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const id = `settings-${title.toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "rounded-lg border bg-card p-5 sm:p-6",
        tone === "danger" && "border-destructive/40",
      )}
    >
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
