import type { Metadata } from "next";
import { MyAnimeView } from "@/features/anime/components/my-anime-view";

export const metadata: Metadata = { title: "Meine Anime" };

export default function MyAnimePage() {
  return <MyAnimeView />;
}
