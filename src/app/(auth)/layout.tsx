import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import { LegalLinks } from "@/features/marketing/legal-links";
import { demoAnime } from "@/data/demo/anime";
import { getLiveCatalog } from "@/lib/anime-api/anilist";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const catalog = (await getLiveCatalog())?.items ?? demoAnime;
  const covers = catalog
    .filter((anime) => anime.coverUrl || anime.art)
    .slice(0, 10);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-w-0 flex-col px-4 py-5 sm:px-8">
        <header>
          <Link
            href="/"
            aria-label="ANIMORA – zur Startseite"
            className="inline-flex rounded-md"
          >
            <Logo />
          </Link>
        </header>
        <main
          id="main"
          className="flex flex-1 items-center justify-center py-10"
        >
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <footer className="text-xs text-muted-foreground">
          <LegalLinks />
        </footer>
      </div>

      <aside
        aria-hidden="true"
        className="sticky top-0 hidden h-dvh overflow-hidden border-l bg-surface lg:block"
      >
        <div className="absolute inset-0 grid -translate-y-10 -rotate-6 scale-110 grid-cols-4 content-start gap-4 p-8 opacity-80">
          {[...covers, ...covers].slice(0, 20).map((anime, index) => (
            <AnimeCover
              key={`${anime.id}-${index}`}
              anime={anime}
              variant={index}
              showTitle
              className="shadow-lg"
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="font-display text-5xl leading-[0.95] font-bold uppercase">
            Deine Anime-Welt.
            <br />
            <span className="text-brand">Deine Community.</span>
          </p>
          <p className="mt-4 max-w-md text-muted-foreground">
            Favoriten verfolgen, keine Folge verpassen und jede Episode mit Fans
            diskutieren – ohne Spoiler.
          </p>
        </div>
      </aside>
    </div>
  );
}
