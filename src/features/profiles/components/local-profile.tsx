"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { UserXIcon } from "lucide-react";
import { DetailSkeleton } from "@/components/feedback/skeletons";
import { EmptyState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";
import { ProfileView } from "@/features/profiles/components/profile-view";
import { fetchProfileByUsername } from "@/features/profiles/profiles-supabase";
import { useDemoState } from "@/features/demo/store";
import {
  getRemoteProfilesVersion,
  getUserByUsernameSync,
  subscribeRemoteProfiles,
} from "@/lib/data/users";

/**
 * Profile, die der Server nicht kennt: im Browser registrierte Demo-Konten
 * und andere echte Nutzer aus der Tabelle `profiles`. Diese Komponente sucht
 * sie nach dem Laden des Demo-Stores und lädt echte Profile bei Bedarf nach.
 */
export function LocalProfile({ username }: { username: string }) {
  const { hydrated, accounts, profileOverrides } = useDemoState();
  const remoteVersion = useSyncExternalStore(
    subscribeRemoteProfiles,
    getRemoteProfilesVersion,
    () => 0,
  );
  const [checkedName, setCheckedName] = useState<string | null>(null);

  // accounts/profileOverrides/remoteVersion lösen nach Änderungen ein erneutes Rendern aus.
  void accounts;
  void profileOverrides;
  void remoteVersion;
  const user = hydrated ? getUserByUsernameSync(username) : undefined;
  const shouldFetch = hydrated && !user && checkedName !== username;

  useEffect(() => {
    if (!shouldFetch) return;
    let active = true;
    void fetchProfileByUsername(username).finally(() => {
      if (active) setCheckedName(username);
    });
    return () => {
      active = false;
    };
  }, [username, shouldFetch]);

  if (!hydrated || shouldFetch) return <DetailSkeleton />;
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
