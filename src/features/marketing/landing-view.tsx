import Link from "next/link";
import {
  CalendarClockIcon,
  CompassIcon,
  EyeOffIcon,
  HeartIcon,
  MessagesSquareIcon,
  UsersIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SpoilerGuard } from "@/components/feedback/spoiler-guard";
import {
  AnimeBackdrop,
  AnimeCover,
} from "@/features/anime/components/anime-cover";
import { AniListCredit } from "@/features/anime/components/anilist-credit";
import { DemoButton } from "@/features/marketing/marketing-chrome";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { demoAnime } from "@/data/demo/anime";
import { getLiveCatalog } from "@/lib/anime-api/anilist";
import { formatDateTime } from "@/lib/format";
import { getUserByIdSync } from "@/lib/data/users";

const features = [
  {
    icon: CalendarClockIcon,
    title: "Dein persönliches Dashboard",
    text: "Neue Folgen deiner Lieblingsserien mit Countdown, die passenden Diskussionen und was deine Community gerade bewegt.",
  },
  {
    icon: EyeOffIcon,
    title: "Diskutieren ohne Spoiler",
    text: "Jede Episode hat ihre eigene Diskussion. Spoiler bleiben verdeckt, bis du die Folge als gesehen markierst.",
  },
  {
    icon: UsersIcon,
    title: "Eine Community für Fans",
    text: "Teile Theorien, Fanart und Cosplay, folge Gleichgesinnten und kommentiere Beiträge.",
  },
  {
    icon: CompassIcon,
    title: "Neues entdecken",
    text: "Finde Serien nach Genre, Status und Bewertung und favorisiere sie mit einem Tipp.",
  },
];

const steps = [
  {
    title: "Konto erstellen",
    text: "Mit E-Mail-Adresse registrieren und bestätigen.",
  },
  {
    title: "Lieblings-Anime wählen",
    text: "Mehrere Serien auswählen – daraus entsteht dein Dashboard.",
  },
  {
    title: "Darstellung festlegen",
    text: "Hell oder dunkel, dazu deine Akzentfarbe.",
  },
];

export async function LandingView() {
  // Derselbe gecachte Katalog wie im Root-Layout – keine zusätzliche Anfrage.
  const catalog = (await getLiveCatalog())?.items ?? demoAnime;
  const bySlug = (slug: string) =>
    catalog.find((anime) => anime.slug === slug)!;
  // Hero: die Serie mit der nächsten angekündigten Folge.
  const featured =
    catalog
      .filter((anime) => anime.nextAiring)
      .toSorted((a, b) => a.nextAiring!.airingAt - b.nextAiring!.airingAt)[0] ??
    bySlug("one-piece");
  const side = catalog.filter((anime) => anime.id !== featured.id);
  const conan = side[0];
  const frieren = side[1];
  const popular = catalog
    .toSorted((a, b) => b.score - a.score)
    .filter((anime) => anime.coverUrl || anime.art)
    .slice(0, 6);
  const commenterA = getUserByIdSync("u-conanmaster");
  const commenterB = getUserByIdSync("u-shinichi");

  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative isolate overflow-hidden border-b"
      >
        <div className="mx-auto grid max-w-[77.5rem] items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-bold tracking-[0.16em] text-brand uppercase">
              Die Anime-Community
            </p>
            <h1
              id="hero-title"
              className="mt-4 font-display text-[3.25rem] leading-[0.92] font-bold text-balance uppercase sm:text-7xl"
            >
              Deine Anime-Welt.{" "}
              <span className="text-brand">Deine Community.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Verfolge deine Lieblingsserien, verpasse keine neue Folge und
              diskutiere jede Episode mit Fans – ohne dir die Spannung zu
              verderben.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={buttonVariants({ size: "lg" })}>
                Kostenlos registrieren
              </Link>
              <DemoButton />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Anime-Daten live von AniList · Community-Inhalte und Konten sind
              Beispieldaten.
            </p>
          </div>

          <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
            <div className="absolute -top-6 -left-4 w-28 -rotate-6 sm:w-36">
              <AnimeCover anime={conan} showTitle className="shadow-xl" />
            </div>
            <div className="absolute -right-2 -bottom-8 w-28 rotate-6 sm:w-36">
              <AnimeCover anime={frieren} showTitle className="shadow-xl" />
            </div>
            <div className="relative mx-8 overflow-hidden rounded-2xl border bg-card shadow-2xl sm:mx-12">
              <div className="relative aspect-[4/3]">
                <AnimeBackdrop anime={featured} seed="landing-hero" priority />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                <p className="absolute bottom-3 left-4 font-display text-3xl font-bold text-white uppercase">
                  {featured.title}
                </p>
              </div>
              <div className="p-4">
                {featured.nextAiring ? (
                  <>
                    <p className="text-xs font-bold tracking-wider text-brand uppercase">
                      Nächste Folge
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold">
                      Episode {featured.nextAiring.episode}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateTime(featured.nextAiring.airingAt)} Uhr
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold tracking-wider text-brand uppercase">
                      {featured.studio}
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold">
                      {featured.episodeCount} Episoden
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="funktionen"
        aria-labelledby="features-title"
        className="scroll-mt-20 border-b"
      >
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2
            id="features-title"
            className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            Alles für deine Serien an einem Ort
          </h2>
          <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <li key={feature.title}>
                <span className="flex size-11 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="spoiler-title" className="border-b bg-surface">
        <div className="mx-auto grid max-w-[77.5rem] items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <h2
              id="spoiler-title"
              className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
            >
              Mitreden, ohne dass dir jemand das Ende verrät
            </h2>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">
              Kommentare mit Spoiler-Markierung bleiben verdeckt, bis du sie
              bewusst aufdeckst oder die Folge als gesehen markierst. Probier es
              direkt hier aus.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MessagesSquareIcon
                className="size-4 text-brand"
                aria-hidden="true"
              />
              Detektiv Conan · Diskussion zu Episode 1185
            </p>
            <ul className="mt-4 divide-y">
              <li className="flex gap-3 py-4">
                <UserAvatar user={commenterB} size="sm" />
                <div>
                  <p className="text-sm font-semibold">
                    {commenterB?.username}
                  </p>
                  <p className="mt-1">
                    Die letzten fünf Minuten waren Spannung pur!
                  </p>
                </div>
              </li>
              <li className="flex gap-3 py-4">
                <UserAvatar user={commenterA} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {commenterA?.username}
                  </p>
                  <SpoilerGuard
                    active
                    reason="Enthält Spoiler"
                    className="mt-1"
                  >
                    <p>
                      Der Hinweis mit der stehengebliebenen Uhr kam schon in
                      Folge 1181 – das war kein Zufall.
                    </p>
                  </SpoilerGuard>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        id="so-gehts"
        aria-labelledby="steps-title"
        className="scroll-mt-20 border-b"
      >
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h2
            id="steps-title"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            In drei Schritten startklar
          </h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t-2 border-primary pt-5">
                <span className="font-display text-4xl font-bold text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                <p className="mt-1 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="popular-title" className="border-b">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2
              id="popular-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Beliebt in der Community
            </h2>
            <Link
              href="/anime"
              className="shrink-0 text-sm font-semibold text-brand hover:underline"
            >
              Alle entdecken
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {popular.map((anime) => (
              <li key={anime.id}>
                <Link
                  href={`/anime/${anime.slug}`}
                  className="group block rounded-lg"
                >
                  <AnimeCover
                    anime={anime}
                    showTitle
                    className="transition-transform duration-200 group-hover:-translate-y-1"
                  />
                  <span className="sr-only">{anime.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <AniListCredit className="mt-4" />
        </div>
      </section>

      <section aria-labelledby="cta-title">
        <div className="mx-auto max-w-[77.5rem] px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <HeartIcon className="mx-auto size-8 text-brand" aria-hidden="true" />
          <h2
            id="cta-title"
            className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            Bereit für die nächste Folge?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Registriere dich kostenlos oder schau dir die Demo mit Beispieldaten
            an.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Kostenlos registrieren
            </Link>
            <DemoButton />
          </div>
        </div>
      </section>
    </>
  );
}
