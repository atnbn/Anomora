"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { LegalLinks } from "@/features/marketing/legal-links";
import { useViewer } from "@/features/profiles/hooks";
import { demoActions } from "@/features/demo/store";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const { viewer, hydrated } = useViewer();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[77.5rem] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="ANIMORA – Startseite" className="rounded-md">
          <Logo compact className="sm:hidden" />
          <Logo className="hidden sm:inline-flex" />
        </Link>
        <nav aria-label="Seitenbereiche" className="hidden md:block">
          <ul className="flex gap-1 text-sm font-semibold text-muted-foreground">
            <li>
              <Link
                href="/#funktionen"
                className="rounded-md px-3 py-2 hover:text-foreground"
              >
                Funktionen
              </Link>
            </li>
            <li>
              <Link
                href="/#so-gehts"
                className="rounded-md px-3 py-2 hover:text-foreground"
              >
                So geht&apos;s
              </Link>
            </li>
            <li>
              <Link
                href="/anime"
                className="rounded-md px-3 py-2 hover:text-foreground"
              >
                Anime entdecken
              </Link>
            </li>
          </ul>
        </nav>
        <div
          className={cn(
            "ml-auto flex items-center gap-2 transition-opacity",
            !hydrated && "opacity-0",
          )}
        >
          {viewer ? (
            <Link href="/dashboard" className={buttonVariants()}>
              Zum Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost" })}
              >
                Anmelden
              </Link>
              <Link href="/register" className={buttonVariants()}>
                Registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Meldet mit dem Demo-Konto an und öffnet das Dashboard. */
export function DemoButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "outline" | "default";
}) {
  const router = useRouter();
  return (
    <Button
      size="lg"
      variant={variant}
      className={className}
      onClick={() => {
        demoActions.signIn();
        toast.success("Mit Demo-Konto angemeldet");
        router.push("/dashboard");
      }}
    >
      Demo ansehen
    </Button>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto grid max-w-[77.5rem] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Anime entdecken, Lieblingsserien verfolgen und jede Episode mit der
            Community diskutieren.
          </p>
        </div>
        <nav aria-label="Produkt" className="text-sm">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            <li>
              <Link href="/anime" className="hover:underline">
                Entdecken
              </Link>
            </li>
            <li>
              <Link href="/community" className="hover:underline">
                Community
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:underline">
                Registrieren
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground md:col-span-2 md:flex-row md:items-center md:justify-between">
          <LegalLinks />
          <p>© 2026 ANIMORA · Demo-Version mit Beispieldaten</p>
        </div>
      </div>
    </footer>
  );
}
