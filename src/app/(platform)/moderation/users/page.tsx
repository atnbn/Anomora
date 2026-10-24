import type { Metadata } from "next";
import { ModerationGate } from "@/features/moderation/moderation-shell";
import { ModerationUsersView } from "@/features/moderation/users-view";

export const metadata: Metadata = { title: "Nutzer · Moderation" };

export default function ModerationUsersPage() {
  return (
    <ModerationGate>
      <ModerationUsersView />
    </ModerationGate>
  );
}
