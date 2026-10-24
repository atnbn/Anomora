import type { Metadata } from "next";
import { ProfileSettings } from "@/features/settings/profile-settings";

export const metadata: Metadata = { title: "Profil · Einstellungen" };

export default function Page() {
  return <ProfileSettings />;
}
