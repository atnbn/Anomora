import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { FollowListView } from "@/features/profiles/components/follow-list-view";

type Props = PageProps<"/u/[username]/followers">;

export const metadata: Metadata = { title: "Follower" };

async function FollowList({ params }: Pick<Props, "params">) {
  const { username } = await params;
  return (
    <FollowListView username={decodeURIComponent(username)} kind="followers" />
  );
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <FollowList params={params} />
    </Suspense>
  );
}
