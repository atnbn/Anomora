"use client";

import { UserXIcon } from "lucide-react";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { EmptyState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import { ProfileView } from "@/features/profiles/components/profile-view";
import { useDemoState } from "@/features/demo/store";
import { getUserByUsernameSync } from "@/lib/data/users";

/**
 * Profile von Konten, die im Browser registriert wurden, kennt der Server
 * nicht. Diese Komponente sucht sie nach dem Laden des Demo-Stores.
 */
export function LocalProfile({ username }: { username: string }) {
  const { hydrated, accounts, profileOverrides } = useDemoState();
  if (!hydrated) return <DetailSkeleton />;

  // accounts/profileOverrides lösen nach Änderungen ein erneutes Rendern aus.
  void accounts;
  void profileOverrides;
  const user = getUserByUsernameSync(username);
  if (user) return <ProfileView user={user} />;

  return (
    <PageContainer>
      <EmptyState
        icon={UserXIcon}
        title="Profil nicht gefunden"
        description={`Es gibt kein Mitglied mit dem Nutzernamen „${username}“. Vielleicht wurde der Name geändert oder das Konto gelöscht.`}
        action={{ label: "Zur Community", href: "/community" }}
      />
    </PageContainer>
  );
}
