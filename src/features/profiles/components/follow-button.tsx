"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/features/profiles/types";
import { useFollowStats } from "@/features/profiles/hooks";
import {
  demoActions,
  requireSession,
  useDemoState,
} from "@/features/demo/store";
import { cn } from "@/lib/utils";

export function FollowButton({
  user,
  size = "sm",
  className,
}: {
  user: UserProfile;
  size?: "sm" | "default";
  className?: string;
}) {
  const { isFollowing } = useFollowStats(user.id);
  const { session } = useDemoState();
  if (session?.userId === user.id) return null;

  return (
    <Button
      size={size}
      variant={isFollowing ? "outline" : "secondary"}
      aria-pressed={isFollowing}
      aria-label={
        isFollowing ? `${user.username} entfolgen` : `${user.username} folgen`
      }
      className={cn(
        "min-w-[5.5rem]",
        !isFollowing && "bg-brand-soft text-brand hover:bg-brand-soft/80",
        className,
      )}
      onClick={() => {
        if (!requireSession("Melde dich an, um anderen zu folgen.")) return;
        demoActions.toggleFollow(user.id);
        toast.success(
          isFollowing
            ? `Du folgst ${user.username} nicht mehr`
            : `Du folgst jetzt ${user.username}`,
        );
      }}
    >
      {isFollowing ? "Gefolgt" : "Folgen"}
    </Button>
  );
}
