import type { Metadata } from "next";
import { AccountSettings } from "@/features/settings/account-settings";

export const metadata: Metadata = {
  title: "Konto & Sicherheit · Einstellungen",
};

export default function Page() {
  return <AccountSettings />;
}
