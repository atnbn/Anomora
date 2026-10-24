import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            aria-label="ANIMORA – zur Startseite"
            className="rounded-md"
          >
            <Logo />
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md px-2 py-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Später fortsetzen
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
