import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedSkeleton } from "@/components/feedback/skeletons";
import { PageContainer } from "@/components/layout/app-shell";
import { FeedView } from "@/features/community/components/feed-view";

export const metadata: Metadata = { title: "Community" };

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <FeedSkeleton />
        </PageContainer>
      }
    >
      <FeedView />
    </Suspense>
  );
}
