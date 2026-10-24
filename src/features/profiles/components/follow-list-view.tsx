"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import {
  ChevronLeftIcon,
  SearchXIcon,
  UsersIcon,
  UserXIcon,
} from "lucide-react";
import { inputClass } from "@/components/forms/fields";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { EmptyState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import { FollowButton } from "@/features/profiles/components/follow-button";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import {
  profileHref,
  UserName,
} from "@/features/profiles/components/user-name";
import { useFollowStats } from "@/features/profiles/hooks";
import type { UserProfile } from "@/features/profiles/types";
import { useDemoState } from "@/features/demo/store";
import { getUserByIdSync, getUserByUsernameSync } from "@/lib/data/users";
import { cn } from "@/lib/utils";

export type FollowListKind = "followers" | "following";

function FollowList({
  user,
  kind,
}: {
  user: UserProfile;
  kind: FollowListKind;
}) {
  const { session } = useDemoState();
  const stats = useFollowStats(user.id);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLocaleLowerCase("de"));
  const isOwn = session?.userId === user.id;
  const people = stats[kind]
    .map((id) => getUserByIdSync(id))
    .filter((entry): entry is UserProfile => entry !== undefined);
  const filtered = deferred
    ? people.filter((person) =>
        `${person.username} ${person.displayName}`
          .toLocaleLowerCase("de")
          .includes(deferred),
      )
    : people;

  const tabs: { kind: FollowListKind; label: string; count: number }[] = [
    { kind: "followers", label: "Follower", count: stats.followers.length },
    {
      kind: "following",
      label: isOwn ? "Folge ich" : "Gefolgt",
      count: stats.following.length,
    },
  ];

  return (
    <PageContainer className="max-w-3xl">
      <Link
        href={profileHref(user)}
        className="-ml-2 inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" aria-hidden="true" />
        Zum Profil
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">
            {kind === "followers"
              ? "Follower"
              : isOwn
                ? "Folge ich"
                : "Gefolgt"}
          </h1>
          <p className="truncate text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      <nav aria-label="Listen" className="mt-6">
        <ul className="flex gap-1.5">
          {tabs.map((tab) => (
            <li key={tab.kind}>
              <Link
                href={`${profileHref(user)}/${tab.kind}`}
                aria-current={tab.kind === kind ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground",
                  tab.kind === kind &&
                    "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {tab.label}
                <span className="rounded-full bg-foreground/10 px-1.5 text-xs tabular">
                  {tab.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {people.length > 5 && (
        <div className="mt-5">
          <label htmlFor="follow-search" className="sr-only">
            Personen in dieser Liste suchen
          </label>
          <input
            id="follow-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="In dieser Liste suchen"
            className={inputClass}
          />
        </div>
      )}

      <div className="mt-5">
        {people.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={
              kind === "followers"
                ? isOwn
                  ? "Dir folgt noch niemand"
                  : `${user.username} hat noch keine Follower`
                : isOwn
                  ? "Du folgst noch niemandem"
                  : `${user.username} folgt noch niemandem`
            }
            description={
              isOwn
                ? "Beiträge in der Community sind der beste Weg, Leute mit ähnlichem Geschmack zu finden."
                : undefined
            }
            action={
              isOwn ? { label: "Zur Community", href: "/community" } : undefined
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            compact
            icon={SearchXIcon}
            title={`Niemand gefunden für „${query.trim()}“`}
            action={{
              label: "Suche zurücksetzen",
              onClick: () => setQuery(""),
            }}
          />
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {filtered.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-3 p-3 sm:p-4"
              >
                <Link
                  href={profileHref(person)}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <UserAvatar user={person} size="md" />
                </Link>
                <div className="min-w-0 flex-1">
                  <UserName user={person} />
                  <p className="truncate text-sm text-muted-foreground">
                    {person.bio ?? person.displayName}
                  </p>
                </div>
                <FollowButton user={person} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}

export function FollowListView({
  username,
  kind,
}: {
  username: string;
  kind: FollowListKind;
}) {
  const { hydrated, accounts, profileOverrides } = useDemoState();
  // Lokale Konten sind erst nach dem Laden des Stores bekannt.
  void accounts;
  void profileOverrides;
  const user = getUserByUsernameSync(username);
  if (!user && !hydrated) return <DetailSkeleton />;
  if (!user) {
    return (
      <PageContainer>
        <EmptyState
          icon={UserXIcon}
          title="Profil nicht gefunden"
          description={`Es gibt kein Mitglied mit dem Nutzernamen „${username}“.`}
          action={{ label: "Zur Community", href: "/community" }}
        />
      </PageContainer>
    );
  }
  return <FollowList user={user} kind={kind} />;
}
