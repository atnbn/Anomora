import type { Metadata } from "next";
import { AppearanceSettings } from "@/features/settings/appearance-settings";

export const metadata: Metadata = { title: "Darstellung · Einstellungen" };

export default function Page() {
  return <AppearanceSettings />;
}
