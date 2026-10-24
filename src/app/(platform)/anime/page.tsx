import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { DiscoverView } from "@/features/anime/components/discover-view";

export const metadata: Metadata = { title: "Entdecken" };

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DiscoverView />
    </Suspense>
  );
}
