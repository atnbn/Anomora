import Link from "next/link";
import { BadgeCheckIcon, ShieldCheckIcon } from "lucide-react";
import type { UserProfile } from "@/features/profiles/types";
import { cn } from "@/lib/utils";

export function profileHref(user: Pick<UserProfile, "username">) {
  return `/u/${encodeURIComponent(user.username)}`;
}

/** Anzeigename mit Abzeichen; kürzt lange Namen statt das Layout zu sprengen. */
export function UserName({
  user,
  showHandle = false,
  link = true,
  className,
}: {
  user: UserProfile | undefined;
  showHandle?: boolean;
  link?: boolean;
  className?: string;
}) {
  if (!user) {
    return (
      <span className={cn("font-semibold text-muted-foreground", className)}>
        Gelöschtes Konto
      </span>
    );
  }

  const name = (
    <span className="truncate font-semibold text-foreground">
      {user.username}
    </span>
  );

  return (
    <span className={cn("flex min-w-0 items-center gap-1", className)}>
      {link ? (
        <Link
          href={profileHref(user)}
          className="min-w-0 truncate rounded-sm hover:underline hover:underline-offset-2"
        >
          {name}
        </Link>
      ) : (
        name
      )}
      {user.badges.includes("verified") && (
        <BadgeCheckIcon
          className="size-4 shrink-0 text-brand"
          aria-label="Verifiziert"
          role="img"
        />
      )}
      {user.badges.includes("team") && (
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-sm bg-brand-soft px-1.5 py-px text-[0.6875rem] font-semibold text-brand">
          <ShieldCheckIcon className="size-3" aria-hidden="true" />
          {user.role === "moderator" && user.username !== "AnimoraTeam"
            ? "Mod"
            : "Team"}
        </span>
      )}
      {showHandle && user.displayName !== user.username && (
        <span className="truncate text-sm text-muted-foreground">
          {user.displayName}
        </span>
      )}
    </span>
  );
}
