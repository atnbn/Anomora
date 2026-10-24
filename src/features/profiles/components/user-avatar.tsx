import { UserIcon } from "lucide-react";
import type { UserProfile } from "@/features/profiles/types";
import { cn } from "@/lib/utils";

const sizeClass = {
  xs: "size-6 text-[0.625rem]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-24 text-3xl",
} as const;

/** Generierter Avatar mit Initiale; Nutzer ohne Avatar sehen ein neutrales Symbol. */
export function UserAvatar({
  user,
  size = "md",
  className,
}: {
  user: Pick<UserProfile, "displayName" | "avatarHue"> | undefined;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const hue = user?.avatarHue;
  const initial = user?.displayName.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white select-none",
        sizeClass[size],
        hue === undefined && "bg-muted text-muted-foreground",
        className,
      )}
      style={
        hue === undefined
          ? undefined
          : {
              backgroundColor: `oklch(0.52 0.13 ${hue})`,
              backgroundImage: `radial-gradient(circle at 30% 25%, oklch(0.68 0.14 ${hue}) 0, transparent 60%)`,
            }
      }
    >
      {hue === undefined ? <UserIcon className="size-[55%]" /> : initial}
    </span>
  );
}
