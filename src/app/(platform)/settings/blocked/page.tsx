import type { Metadata } from "next";
import { BlockedSettings } from "@/features/settings/blocked-settings";

export const metadata: Metadata = {
  title: "Blockierte Nutzer · Einstellungen",
};

export default function Page() {
  return <BlockedSettings />;
}
