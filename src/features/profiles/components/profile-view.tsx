"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  BanIcon,
  CalendarIcon,
  FlagIcon,
  HeartIcon,
  MessagesSquareIcon,
  MoreHorizontalIcon,
  UserRoundPenIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import { PageTabs } from "@/components/layout/page-tabs";
import type { Anime } from "@/features/anime/types";
import type { UserProfile } from "@/features/profiles/types";
import { AnimeBackdrop } from "@/features/anime/components/anime-cover";
import { AnimeCard } from "@/features/anime/components/anime-card";
import { usePosts } from "@/features/community/hooks";
import { PostCard } from "@/features/community/components/post-card";
import {
  ConfirmDialog,
  ReportDialog,
} from "@/features/community/components/moderation-dialogs";
import { FollowButton } from "@/features/profiles/components/follow-button";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import {
  profileHref,
  UserName,
} from "@/features/profiles/components/user-name";
import { useFollowStats } from "@/features/profiles/hooks";
import {
  demoActions,
  requireSession,
  useDemoState,
} from "@/features/demo/store";
import { getAnimeByIdSync } from "@/lib/data/anime";
import { formatCount, formatDateLong } from "@/lib/format";

export function ProfileView({ user }: { user: UserProfile }) {
  const demo = useDemoState();
  const isOwn = demo.session?.userId === user.id;
  const isBlocked = demo.blockedUserIds.includes(user.id);
  const { followers, following } = useFollowStats(user.id);
  const favoriteIds = isOwn ? demo.favorites : user.favoriteAnimeIds;
  const favorites = favoriteIds
    .map((id) => getAnimeByIdSync(id))
    .filter((anime): anime is Anime => anime !== undefined);
  const posts = usePosts().filter((post) => post.authorId === user.id);
  const banner = favorites.find(
    (anime) => anime.bannerUrl || anime.coverUrl || anime.art,
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  return (
    <>
      <div className="relative h-36 overflow-hidden border-b bg-muted sm:h-48">
        {banner && <AnimeBackdrop anime={banner} seed={`${user.id}-banner`} />}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent"
        />
      </div>
      <PageContainer className="pt-0 lg:pt-0">
        <div className="relative z-10 -mt-12 flex items-end justify-between gap-4">
          <UserAvatar
            user={user}
            size="xl"
            className="ring-4 ring-background"
          />
          <div className="flex items-center gap-2 pb-1">
            {isOwn ? (
              <Link
                href="/settings/profile"
                className={buttonVariants({ variant: "outline" })}
              >
                Profil bearbeiten
              </Link>
            ) : (
              !isBlocked && <FollowButton user={user} size="default" />
            )}
            {!isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Weitere Aktionen für ${user.username}`}
                  className="flex size-10 items-center justify-center rounded-full border hover:bg-accent"
                >
                  <MoreHorizontalIcon className="size-5" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 p-1.5">
                  <DropdownMenuItem
                    className="min-h-10 gap-2.5 px-2.5"
                    onClick={() => {
                      if (
                        requireSession("Melde dich an, um Profile zu melden.")
                      )
                        setReportOpen(true);
                    }}
                  >
                    <FlagIcon aria-hidden="true" />
                    Profil melden
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    className="min-h-10 gap-2.5 px-2.5"
                    onClick={() => {
                      if (
                        !requireSession(
                          "Melde dich an, um Nutzer zu blockieren.",
                        )
                      )
                        return;
                      if (isBlocked) {
                        demoActions.toggleBlock(user.id);
                        toast.success(
                          `Blockierung von ${user.username} aufgehoben`,
                        );
                      } else setBlockOpen(true);
                    }}
                  >
                    <BanIcon aria-hidden="true" />
                    {isBlocked ? "Blockierung aufheben" : "Blockieren"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="mt-3 min-w-0">
          <h1 className="text-2xl leading-tight font-bold">
            <UserName user={user} link={false} />
          </h1>
          <p className="truncate text-muted-foreground">{user.displayName}</p>
        </div>

        {user.profileComplete ? (
          user.bio && <p className="mt-4 max-w-2xl break-words">{user.bio}</p>
        ) : (
          <p className="mt-4 flex max-w-2xl items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
            <UserRoundPenIcon className="size-4 shrink-0" aria-hidden="true" />
            {isOwn ? (
              <span>
                Dein Profil ist noch nicht vollständig.{" "}
                <Link
                  href="/onboarding"
                  className="font-semibold text-brand hover:underline"
                >
                  Jetzt einrichten
                </Link>
              </span>
            ) : (
              "Dieses Profil ist noch nicht vollständig eingerichtet."
            )}
          </p>
        )}

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex gap-1.5">
            <dd className="font-bold tabular">{formatCount(posts.length)}</dd>
            <dt className="text-muted-foreground">Beiträge</dt>
          </div>
          <div>
            <dt className="sr-only">Follower</dt>
            <dd>
              <Link
                href={`${profileHref(user)}/followers`}
                className="flex gap-1.5 rounded-sm hover:underline"
              >
                <span className="font-bold tabular">
                  {formatCount(followers.length)}
                </span>
                <span className="text-muted-foreground">Follower</span>
              </Link>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Gefolgt</dt>
            <dd>
              <Link
                href={`${profileHref(user)}/following`}
                className="flex gap-1.5 rounded-sm hover:underline"
              >
                <span className="font-bold tabular">
                  {formatCount(following.length)}
                </span>
                <span className="text-muted-foreground">
                  {isOwn ? "Folge ich" : "Gefolgt"}
                </span>
              </Link>
            </dd>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarIcon className="size-4" aria-hidden="true" />
            <dt className="sr-only">Dabei seit</dt>
            <dd>
              Dabei seit{" "}
              {formatDateLong(Date.parse(user.joinedAt)).replace(/^\w+, /, "")}
            </dd>
          </div>
        </dl>

        {isBlocked ? (
          <EmptyState
            className="mt-8"
            icon={BanIcon}
            title={`Du hast ${user.username} blockiert`}
            description="Beiträge und Kommentare dieser Person werden dir nicht angezeigt."
            action={{
              label: "Blockierung aufheben",
              onClick: () => {
                demoActions.toggleBlock(user.id);
                toast.success(`Blockierung von ${user.username} aufgehoben`);
              },
            }}
          />
        ) : (
          <PageTabs
            className="mt-8"
            label="Profilbereiche"
            tabs={[
              {
                value: "posts",
                label: "Beiträge",
                count: posts.length,
                content:
                  posts.length === 0 ? (
                    <EmptyState
                      icon={MessagesSquareIcon}
                      title="Noch keine Beiträge"
                      description={
                        isOwn
                          ? "Teile deinen ersten Beitrag in der Community."
                          : `${user.username} hat noch nichts gepostet.`
                      }
                      action={
                        isOwn
                          ? { label: "Zur Community", href: "/community" }
                          : undefined
                      }
                    />
                  ) : (
                    <ul className="max-w-2xl space-y-4">
                      {posts.map((post) => (
                        <li key={post.id}>
                          <PostCard post={post} />
                        </li>
                      ))}
                    </ul>
                  ),
              },
              {
                value: "favorites",
                label: "Lieblings-Anime",
                count: favorites.length,
                content:
                  favorites.length === 0 ? (
                    <EmptyState
                      icon={HeartIcon}
                      title="Noch keine Lieblings-Anime"
                      action={
                        isOwn
                          ? { label: "Anime entdecken", href: "/anime" }
                          : undefined
                      }
                    />
                  ) : (
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 xl:grid-cols-6">
                      {favorites.map((anime) => (
                        <li key={anime.id}>
                          <AnimeCard anime={anime} />
                        </li>
                      ))}
                    </ul>
                  ),
              },
            ]}
          />
        )}
      </PageContainer>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="user"
        targetId={user.id}
      />
      <ConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        title={`${user.username} blockieren?`}
        description="Du siehst keine Beiträge und Kommentare mehr von dieser Person, und ihr folgt euch nicht mehr."
        confirmLabel="Blockieren"
        onConfirm={() => {
          demoActions.toggleBlock(user.id);
          toast.success(`${user.username} blockiert`);
        }}
      />
    </>
  );
}
