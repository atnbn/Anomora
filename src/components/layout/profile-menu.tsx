"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  HeartIcon,
  LogInIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  RotateCcwIcon,
  SunIcon,
  UserIcon,
  UserPlusIcon,
  SettingsIcon,
  ShieldCheckIcon,
  FlaskConicalIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { profileHref } from "@/features/profiles/components/user-name";
import { useViewer } from "@/features/profiles/hooks";
import { demoActions, resetDemoState } from "@/features/demo/store";
import { signOut } from "@/features/auth/supabase-auth";
import {
  ACCENTS,
  setAccent,
  useAccent,
  type AccentId,
} from "@/features/themes/accent";
import { cn } from "@/lib/utils";

const itemClass = "min-h-10 gap-2.5 px-2.5 py-2";

export function ProfileMenu() {
  const { viewer, hydrated } = useViewer();
  const { theme, setTheme } = useTheme();
  const accent = useAccent();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={viewer ? `Profilmenü von ${viewer.username}` : "Profilmenü"}
        className="flex size-10 items-center justify-center rounded-full ring-offset-2 ring-offset-background outline-none hover:ring-2 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring"
      >
        {hydrated && viewer ? (
          <UserAvatar user={viewer} size="md" />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserIcon className="size-5" aria-hidden="true" />
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 p-1.5">
        {viewer ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2 text-foreground">
              <UserAvatar user={viewer} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {viewer.displayName}
                </span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  @{viewer.username}
                </span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuItem
              className={itemClass}
              render={<Link href={profileHref(viewer)} />}
            >
              <UserIcon aria-hidden="true" />
              Mein Profil
            </DropdownMenuItem>
            <DropdownMenuItem
              className={itemClass}
              render={<Link href="/my-anime" />}
            >
              <HeartIcon aria-hidden="true" />
              Meine Anime
            </DropdownMenuItem>
            <DropdownMenuItem
              className={itemClass}
              render={<Link href="/settings/profile" />}
            >
              <SettingsIcon aria-hidden="true" />
              Einstellungen
            </DropdownMenuItem>
            {viewer.role === "moderator" && (
              <DropdownMenuItem
                className={itemClass}
                render={<Link href="/moderation" />}
              >
                <ShieldCheckIcon aria-hidden="true" />
                Moderation
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        ) : (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2.5 py-2 text-sm">
              Du bist abgemeldet.
            </DropdownMenuLabel>
            <DropdownMenuItem
              className={itemClass}
              render={<Link href="/login" />}
            >
              <LogInIcon aria-hidden="true" />
              Anmelden
            </DropdownMenuItem>
            <DropdownMenuItem
              className={itemClass}
              render={<Link href="/register" />}
            >
              <UserPlusIcon aria-hidden="true" />
              Registrieren
            </DropdownMenuItem>
            <DropdownMenuItem
              className={itemClass}
              onClick={() => {
                demoActions.signIn();
                toast.success("Mit Demo-Konto angemeldet");
              }}
            >
              <FlaskConicalIcon aria-hidden="true" />
              Mit Demo-Konto anmelden
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5">Darstellung</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme ?? "dark"}
            onValueChange={(value) => setTheme(value)}
          >
            <DropdownMenuRadioItem value="dark" className={itemClass}>
              <MoonIcon aria-hidden="true" />
              Dunkel
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light" className={itemClass}>
              <SunIcon aria-hidden="true" />
              Hell
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className={itemClass}>
              <MonitorIcon aria-hidden="true" />
              Wie System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5">Akzentfarbe</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={accent}
            onValueChange={(value) => setAccent(value as AccentId)}
            className="grid grid-cols-5 gap-1 px-1 pb-1"
          >
            {ACCENTS.map((option) => (
              <DropdownMenuRadioItem
                key={option.id}
                value={option.id}
                aria-label={option.label}
                className={cn(
                  "flex h-10 justify-center rounded-md p-0 pr-0 pl-0",
                  "*:data-[slot=dropdown-menu-radio-item-indicator]:hidden",
                )}
              >
                <span
                  className={cn(
                    "size-6 rounded-full ring-offset-2 ring-offset-popover",
                    accent === option.id && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: option.swatch }}
                />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={itemClass}
          onClick={() => {
            resetDemoState();
            toast.success("Demo-Daten zurückgesetzt");
            router.refresh();
          }}
        >
          <RotateCcwIcon aria-hidden="true" />
          Demo-Daten zurücksetzen
        </DropdownMenuItem>
        {viewer && (
          <DropdownMenuItem
            className={itemClass}
            variant="destructive"
            onClick={() => {
              void signOut();
              toast("Abgemeldet", {
                description: "Du siehst ANIMORA jetzt wie ein Gast.",
              });
            }}
          >
            <LogOutIcon aria-hidden="true" />
            Abmelden
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
