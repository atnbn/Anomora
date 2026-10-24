import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { PostDetailView } from "@/features/community/components/post-detail-view";
import { demoPosts } from "@/data/demo/posts";

type Props = PageProps<"/community/posts/[postId]">;

export function generateStaticParams() {
  return demoPosts.map((post) => ({ postId: post.id }));
}

export const metadata: Metadata = { title: "Beitrag" };

async function PostDetail({ params }: Pick<Props, "params">) {
  const { postId } = await params;
  return <PostDetailView postId={postId} />;
}

export default function PostDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PostDetail params={params} />
    </Suspense>
  );
}
