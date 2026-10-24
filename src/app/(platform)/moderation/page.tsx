import type { Metadata } from "next";
import { ModerationGate } from "@/features/moderation/moderation-shell";
import { ReportsView } from "@/features/moderation/reports-view";

export const metadata: Metadata = { title: "Meldungen · Moderation" };

export default function ModerationPage() {
  return (
    <ModerationGate>
      <ReportsView />
    </ModerationGate>
  );
}
