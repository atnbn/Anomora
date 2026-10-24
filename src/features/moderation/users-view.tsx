"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/forms/fields";
import { EmptyState } from "@/components/feedback/states";
import { ConfirmDialog } from "@/features/community/components/moderation-dialogs";
import { BanDialog, BanPill } from "@/features/moderation/components";
import { useResolvedReports } from "@/features/moderation/hooks";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import {
  profileHref,
  UserName,
} from "@/features/profiles/components/user-name";
import type { UserProfile } from "@/features/profiles/types";
import {
  demoActions,
  findActiveBan,
  useDemoState,
} from "@/features/demo/store";
import { useClock } from "@/features/demo/clock";
import { listUsersSync } from "@/lib/data/users";
import { cn } from "@/lib/utils";

type Filter = "all" | "banned" | "reported";

export function ModerationUsersView() {
  const { bans, accounts, profileOverrides } = useDemoState();
  const clock = useClock();
  const reports = useResolvedReports();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLocaleLowerCase("de"));
  const [filter, setFilter] = useState<Filter>("all");
  const [banTarget, setBanTarget] = useState<UserProfile | null>(null);
  const [unbanTarget, setUnbanTarget] = useState<UserProfile | null>(null);

  const rows = useMemo(() => {
    void accounts;
    void profileOverrides;
    return listUsersSync().map((user) => {
      const ban = findActiveBan(bans, user.id, clock.now, clock.shift);
      return {
        user,
        ban,
        untilTime: ban?.until
          ? Date.parse(ban.until) + (ban.seeded ? clock.shift : 0)
          : null,
        openReports: reports.filter(
          (report) =>
            report.status === "open" &&
            (report.target.authorId === user.id ||
              (report.targetType === "user" && report.targetId === user.id)),
        ).length,
      };
    });
  }, [bans, clock, reports, accounts, profileOverrides]);

  const filtered = rows.filter(
    (row) =>
      (!deferred ||
        `${row.user.username} ${row.user.displayName}`
          .toLocaleLowerCase("de")
          .includes(deferred)) &&
      (filter === "all" ||
        (filter === "banned" && row.ban) ||
        (filter === "reported" && row.openReports > 0)),
  );

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Alle", count: rows.length },
    {
      value: "reported",
      label: "Mit offenen Meldungen",
      count: rows.filter((row) => row.openReports > 0).length,
    },
    {
      value: "banned",
      label: "Gesperrt",
      count: rows.filter((row) => row.ban).length,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="relative">
          <label htmlFor="moderation-user-search" className="sr-only">
            Nutzer suchen
          </label>
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="moderation-user-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nutzername oder Anzeigename"
            className={cn(inputClass, "pl-9")}
          />
        </div>
        <div
          role="group"
          aria-label="Nutzer filtern"
          className="flex flex-wrap gap-1.5"
        >
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground",
                filter === option.value &&
                  "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background",
              )}
            >
              {option.label}
              <span className="text-xs tabular opacity-70">{option.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchXIcon}
          title="Keine Nutzer gefunden"
          action={{
            label: "Filter zurücksetzen",
            onClick: () => {
              setQuery("");
              setFilter("all");
            },
          }}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {filtered.map(({ user, ban, untilTime, openReports }) => (
            <li key={user.id} className="flex flex-wrap items-center gap-3 p-4">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0 flex-1 basis-48">
                <UserName user={user} />
                <p className="truncate text-sm text-muted-foreground">
                  {user.displayName}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {ban ? (
                  <BanPill untilTime={untilTime} />
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-muted-foreground">
                    Aktiv
                  </span>
                )}
                {openReports > 0 && (
                  <span className="rounded-full bg-warning/15 px-2.5 py-0.5 font-semibold text-warning">
                    {openReports} offen
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={profileHref(user)}
                  className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Profil
                </Link>
                {user.role === "moderator" ? (
                  <span className="inline-flex h-9 items-center px-3 text-xs text-muted-foreground">
                    Moderation
                  </span>
                ) : ban ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUnbanTarget(user)}
                  >
                    Sperre aufheben
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBanTarget(user)}
                  >
                    Sperren
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {banTarget && (
        <BanDialog
          key={banTarget.id}
          open
          onOpenChange={(open) => !open && setBanTarget(null)}
          user={banTarget}
        />
      )}
      <ConfirmDialog
        open={unbanTarget !== null}
        onOpenChange={(open) => !open && setUnbanTarget(null)}
        title={`Sperre von ${unbanTarget?.username ?? ""} aufheben?`}
        description="Die Person kann danach wieder Beiträge und Kommentare veröffentlichen."
        confirmLabel="Sperre aufheben"
        destructive={false}
        onConfirm={() => {
          if (!unbanTarget) return;
          demoActions.unbanUser(unbanTarget.id);
          toast.success(`Sperre von ${unbanTarget.username} aufgehoben`);
        }}
      />
    </div>
  );
}
