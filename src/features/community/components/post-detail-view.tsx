"use client";

import Link from "next/link";
import { ChevronLeftIcon, FileQuestionIcon } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { PageContainer } from "@/components/layout/app-shell";
import { usePosts } from "@/features/community/hooks";
import { PostCard } from "@/features/community/components/post-card";
import { CommentThread } from "@/features/community/components/comment-thread";
import { PopularPostsPanel } from "@/features/community/components/community-rail";
import { useDemoState } from "@/features/demo/store";

export function PostDetailView({ postId }: { postId: string }) {
  const posts = usePosts();
  const { hydrated } = useDemoState();
  const post = posts.find((entry) => entry.id === postId);

  // Eigene Beiträge liegen im Browser – vor dem Laden noch nicht bekannt.
  if (!post && !hydrated) return <DetailSkeleton />;

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Link
            href="/community"
            className="-ml-2 inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            Community
          </Link>
          {post ? (
            <>
              <h1 className="sr-only">Beitrag</h1>
              <PostCard post={post} variant="detail" headingLevel={2} />
              <CommentThread target={{ type: "post", postId: post.id }} />
            </>
          ) : (
            <EmptyState
              icon={FileQuestionIcon}
              title="Beitrag nicht gefunden"
              description="Der Beitrag wurde gelöscht, von der Moderation entfernt oder stammt von einer Person, die du blockiert hast."
              action={{ label: "Zur Community", href: "/community" }}
            />
          )}
        </div>
        <aside aria-label="Weitere Beiträge">
          <PopularPostsPanel />
        </aside>
      </div>
    </PageContainer>
  );
}
