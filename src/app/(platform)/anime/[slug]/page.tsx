import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { AnimeDetailView } from "@/features/anime/components/anime-detail-view";
import { getAllAnimeSlugs } from "@/lib/data/anime";
import { getAnimeBySlug } from "@/lib/data/anime-server";

export function generateStaticParams() {
  return getAllAnimeSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/anime/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const anime = await getAnimeBySlug(slug);
  return anime
    ? { title: anime.title, description: anime.synopsis }
    : { title: "Anime nicht gefunden" };
}

async function AnimeDetail({
  params,
}: Pick<PageProps<"/anime/[slug]">, "params">) {
  const { slug } = await params;
  const anime = await getAnimeBySlug(slug);
  if (!anime) notFound();
  return <AnimeDetailView anime={anime} />;
}

export default function AnimeDetailPage({
  params,
}: PageProps<"/anime/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AnimeDetail params={params} />
    </Suspense>
  );
}
