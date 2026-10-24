import type { Metadata } from "next";
import { ModerationGate } from "@/features/moderation/moderation-shell";
import { ModerationLogView } from "@/features/moderation/log-view";

export const metadata: Metadata = { title: "Protokoll · Moderation" };

export default function ModerationLogPage() {
  return (
    <ModerationGate>
      <ModerationLogView />
    </ModerationGate>
  );
}
