import type { Metadata } from "next";
import { LandingView } from "@/features/marketing/landing-view";

export const metadata: Metadata = {
  title: { absolute: "ANIMORA – Deine Anime-Welt. Deine Community." },
};

export default function LandingPage() {
  return <LandingView />;
}
