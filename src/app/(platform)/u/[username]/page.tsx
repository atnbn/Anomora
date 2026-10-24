import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { LocalProfile } from "@/features/profiles/components/local-profile";
import { ProfileView } from "@/features/profiles/components/profile-view";
import { getUserByUsernameSync, listUsersSync } from "@/lib/data/users";

type Props = PageProps<"/u/[username]">;

export function generateStaticParams() {
  return listUsersSync().map((user) => ({ username: user.username }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = getUserByUsernameSync(decodeURIComponent(username));
  return {
    title: user ? `${user.username} (${user.displayName})` : "Profil",
  };
}

async function Profile({ params }: Pick<Props, "params">) {
  const { username } = await params;
  const user = getUserByUsernameSync(decodeURIComponent(username));
  if (!user) return <LocalProfile username={decodeURIComponent(username)} />;
  return <ProfileView user={user} />;
}

export default function ProfilePage({ params }: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Profile params={params} />
    </Suspense>
  );
}
