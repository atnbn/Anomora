import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <Link
        href="/dashboard"
        aria-label="ANIMORA – zum Dashboard"
        className="rounded-md"
      >
        <Logo />
      </Link>
      <p className="mt-12 font-display text-7xl font-bold text-brand">404</p>
      <h1 className="mt-3 text-2xl font-bold">Diese Seite gibt es nicht</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Vielleicht wurde der Inhalt entfernt, oder der Link ist nicht mehr
        aktuell.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
          Zum Dashboard
        </Link>
        <Link
          href="/anime"
          className={buttonVariants({ size: "lg", variant: "outline" })}
        >
          Anime entdecken
        </Link>
      </div>
    </main>
  );
}
