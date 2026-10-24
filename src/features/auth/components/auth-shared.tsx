"use client";

import Link from "next/link";
import { LogOutIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { AccountStatus } from "@/features/demo/store";
import { signOut } from "@/features/auth/supabase-auth";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import type { UserProfile } from "@/features/profiles/types";
import { safeRedirect } from "@/lib/validation/auth";

/** Wohin nach der Anmeldung: erst E-Mail bestätigen, dann Onboarding. */
export function routeAfterSignIn(status: AccountStatus, next: string | null) {
  if (!status.emailVerified) return "/verify-email";
  if (!status.onboardingComplete) return "/onboarding";
  return safeRedirect(next);
}

export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-balance">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/** Hinweis auf Auth-Seiten, wenn bereits eine Sitzung besteht. */
export function SignedInNotice({ viewer }: { viewer: UserProfile }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-3">
        <UserAvatar user={viewer} size="md" />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Angemeldet als</p>
          <p className="truncate font-semibold">{viewer.username}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
          Weiter zum Dashboard
        </Link>
        <Button variant="outline" size="lg" onClick={() => void signOut()}>
          <LogOutIcon aria-hidden="true" />
          Abmelden und anderes Konto nutzen
        </Button>
      </div>
    </div>
  );
}
