"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { FlaskConicalIcon, LogInIcon, ShieldOffIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import { useViewer } from "@/features/profiles/hooks";
import { demoActions, useDemoState } from "@/features/demo/store";
import { DEMO_MOD_ID } from "@/data/demo/users";
import { cn } from "@/lib/utils";

function ModerationTabs({ pathname }: { pathname: string | null }) {
  const { reports } = useDemoState();
  const open = reports.filter((report) => report.status === "open").length;
  const tabs = [
    {
      href: "/moderation",
      label: "Meldungen",
      count: open,
      active:
        pathname === "/moderation" ||
        (pathname?.startsWith("/moderation/reports") ?? false),
    },
    {
      href: "/moderation/users",
      label: "Nutzer",
      active: pathname === "/moderation/users",
    },
    {
      href: "/moderation/log",
      label: "Protokoll",
      active: pathname === "/moderation/log",
    },
  ];

  return (
    <ul className="flex gap-1.5 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <li key={tab.href} className="shrink-0">
          <Link
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground",
              tab.active &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-foreground/15 px-1.5 text-xs tabular">
                <span className="sr-only">offen: </span>
                {tab.count}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ActiveModerationTabs() {
  return <ModerationTabs pathname={usePathname()} />;
}

/**
 * Prüft die Moderationsrechte. Wird in jeder Seite verwendet (nicht im Layout),
 * damit das Layout seine Seite immer rendert.
 */
export function ModerationGate({ children }: { children: React.ReactNode }) {
  const { viewer, hydrated } = useViewer();
  const router = useRouter();

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Wird geladen">
        <Skeleton className="h-10 w-80 rounded-full" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }
  if (!viewer) {
    return (
      <EmptyState
        icon={LogInIcon}
        title="Anmeldung erforderlich"
        description="Die Moderation ist nur für angemeldete Moderatorinnen und Moderatoren zugänglich."
        action={{ label: "Anmelden", href: "/login?next=/moderation" }}
      />
    );
  }
  if (viewer.role !== "moderator") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <ShieldOffIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="max-w-md">
          <h2 className="text-lg font-bold">Keine Berechtigung</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dieser Bereich ist dem Moderationsteam vorbehalten. Dein Konto{" "}
            <span className="font-semibold text-foreground">
              @{viewer.username}
            </span>{" "}
            hat keine Moderationsrechte.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            Zum Dashboard
          </Link>
          <Button
            onClick={() => {
              demoActions.signIn(DEMO_MOD_ID);
              toast.success("Als Moderatorin mod_Ayumi angemeldet");
              router.refresh();
            }}
          >
            <FlaskConicalIcon aria-hidden="true" />
            Demo: als Moderatorin anmelden
          </Button>
        </div>
      </div>
    );
  }
  return (
    <>
      <nav aria-label="Moderationsbereiche">
        <Suspense fallback={<ModerationTabs pathname={null} />}>
          <ActiveModerationTabs />
        </Suspense>
      </nav>
      <div className="mt-6">{children}</div>
    </>
  );
}

export function ModerationShell({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]">
        Moderation
      </h1>
      <p className="mt-1 text-muted-foreground">
        Meldungen prüfen, Inhalte entfernen und Konten sperren.
      </p>
      <p className="mt-4 flex items-start gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
        <FlaskConicalIcon
          className="mt-0.5 size-3.5 shrink-0 text-brand"
          aria-hidden="true"
        />
        Demo-Moderation: Aktionen wirken nur in diesem Browser. Es gibt keine
        serverseitige Rechteprüfung.
      </p>
      <div className="mt-6">{children}</div>
    </PageContainer>
  );
}
