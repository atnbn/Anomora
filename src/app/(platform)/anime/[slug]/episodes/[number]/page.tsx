import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { EpisodeDiscussionView } from "@/features/anime/components/episode-discussion-view";
import { getFeaturedEpisodeParams } from "@/lib/data/anime";
import { getEpisode } from "@/lib/data/anime-server";

type Props = PageProps<"/anime/[slug]/episodes/[number]">;

export function generateStaticParams() {
  return getFeaturedEpisodeParams();
}

async function load(params: Props["params"]) {
  const { slug, number } = await params;
  const parsed = Number(number);
  if (!Number.isInteger(parsed) || parsed < 1) return undefined;
  return getEpisode(slug, parsed);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await load(params);
  if (!result) return { title: "Episode nicht gefunden" };
  return { title: `${result.anime.title} – Episode ${result.episode.number}` };
}

async function EpisodeDiscussion({ params }: Pick<Props, "params">) {
  const result = await load(params);
  if (!result) notFound();
  return <EpisodeDiscussionView {...result} />;
}

export default function EpisodeDiscussionPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EpisodeDiscussion params={params} />
    </Suspense>
  );
}
