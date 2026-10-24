"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ChevronLeftIcon,
  LogInIcon,
  MailWarningIcon,
  PartyPopperIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/states";
import { AnimeCover } from "@/features/anime/components/anime-cover";
import {
  AppearanceStep,
  FavoritesStep,
  ProfileStep,
} from "@/features/onboarding/steps";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { profileHref } from "@/features/profiles/components/user-name";
import { useViewer } from "@/features/profiles/hooks";
import { getAccountStatus } from "@/features/demo/store";
import {
  authErrorMessage,
  finishOnboarding,
} from "@/features/auth/supabase-auth";
import { getAnimeByIdSync } from "@/lib/data/anime";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Erzähl uns von dir",
    description: "So erkennen dich andere in der Community.",
    label: "Profil",
    optional: false,
  },
  {
    title: "Wähle deine Lieblings-Anime",
    description:
      "Du kannst mehrere auswählen. Daraus entsteht dein persönliches Dashboard.",
    label: "Anime",
    optional: true,
  },
  {
    title: "Wähle deine Darstellung",
    description: "Du kannst das später jederzeit im Profilmenü ändern.",
    label: "Darstellung",
    optional: true,
  },
  {
    title: "Alles bereit!",
    description: "Dein Dashboard wartet auf dich.",
    label: "Fertig",
    optional: false,
  },
] as const;

const FORM_ID = "onboarding-step";

export function OnboardingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { viewer, hydrated } = useViewer();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requested = Number(searchParams.get("step") ?? "1");
  const index = Number.isInteger(requested)
    ? Math.min(Math.max(requested, 1), STEPS.length) - 1
    : 0;
  const step = STEPS[index];

  // Nach jedem Schrittwechsel: nach oben und Fokus auf die Überschrift.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [index]);

  function goTo(nextIndex: number) {
    router.push(`/onboarding?step=${nextIndex + 1}`, { scroll: false });
  }

  if (!hydrated) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Wird geladen">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!viewer) {
    return (
      <EmptyState
        icon={LogInIcon}
        title="Melde dich an, um dein Profil einzurichten"
        description="Das Onboarding speichert dein Profil und deine Lieblings-Anime in deinem Konto."
        action={{ label: "Anmelden", href: "/login?next=/onboarding" }}
        secondaryAction={{ label: "Registrieren", href: "/register" }}
      />
    );
  }

  const status = getAccountStatus(viewer.id);
  if (!status.emailVerified) {
    return (
      <EmptyState
        icon={MailWarningIcon}
        title="Bitte bestätige zuerst deine E-Mail"
        description="Erst nach der Bestätigung kannst du dein Profil einrichten."
        action={{ label: "Zur Bestätigung", href: "/verify-email" }}
      />
    );
  }

  const favorites = viewer.favoriteAnimeIds
    .map((id) => getAnimeByIdSync(id))
    .filter((anime) => anime !== undefined);
  const next = () => goTo(index + 1);

  async function finish(target: string) {
    try {
      await finishOnboarding();
      toast.success("Willkommen bei ANIMORA!");
      router.push(target);
    } catch (error) {
      toast.error(authErrorMessage(error as Error));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="font-semibold">
          Schritt {index + 1} von {STEPS.length}
          <span className="text-muted-foreground"> · {step.label}</span>
        </p>
        {step.optional && (
          <span className="text-muted-foreground">Optional</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Fortschritt im Onboarding"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={index + 1}
        aria-valuetext={`Schritt ${index + 1} von ${STEPS.length}: ${step.label}`}
        className="mt-3 grid grid-cols-4 gap-1.5"
      >
        {STEPS.map((entry, position) => (
          <span
            key={entry.label}
            className={cn(
              "h-1.5 rounded-full bg-muted transition-colors duration-200",
              position <= index && "bg-primary",
            )}
          />
        ))}
      </div>

      <header className="mt-8 mb-7">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance outline-none sm:text-3xl"
        >
          {step.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{step.description}</p>
      </header>

      {index === 0 && (
        <ProfileStep viewer={viewer} formId={FORM_ID} onDone={next} />
      )}
      {index === 1 && <FavoritesStep formId={FORM_ID} onDone={next} />}
      {index === 2 && <AppearanceStep formId={FORM_ID} onDone={next} />}
      {index === 3 && (
        <div className="rounded-xl border bg-card p-6 text-center sm:p-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
            <PartyPopperIcon className="size-6" aria-hidden="true" />
          </span>
          <div className="mt-6 flex flex-col items-center">
            <UserAvatar user={viewer} size="xl" />
            <p className="mt-3 text-lg font-bold">{viewer.displayName}</p>
            <p className="text-sm text-muted-foreground">@{viewer.username}</p>
          </div>
          {favorites.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                {favorites.length} Lieblings-Anime auf deinem Dashboard
              </p>
              <ul className="mt-3 flex justify-center -space-x-3">
                {favorites.slice(0, 6).map((anime) => (
                  <li key={anime!.id}>
                    <AnimeCover
                      anime={anime!}
                      className="w-14 rounded-md ring-2 ring-card"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Du hast noch keine Favoriten gewählt – das geht jederzeit unter
              Entdecken.
            </p>
          )}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-6 sm:pb-0 sm:backdrop-blur-none">
        {index > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => goTo(index - 1)}
            className="-ml-3"
          >
            <ChevronLeftIcon aria-hidden="true" />
            Zurück
          </Button>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          {step.optional && (
            <Button type="button" variant="outline" size="lg" onClick={next}>
              Überspringen
            </Button>
          )}
          {index < STEPS.length - 1 ? (
            <Button type="submit" form={FORM_ID} size="lg">
              Weiter
            </Button>
          ) : (
            <>
              <Link
                href={profileHref(viewer)}
                onClick={(event) => {
                  event.preventDefault();
                  void finish(profileHref(viewer));
                }}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Profil ansehen
              </Link>
              <Button size="lg" onClick={() => finish("/dashboard")}>
                Zum Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
