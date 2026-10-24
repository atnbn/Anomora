"use client";

import Link from "next/link";
import { toast } from "sonner";
import { BanIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import { UserAvatar } from "@/features/profiles/components/user-avatar";
import { profileHref } from "@/features/profiles/components/user-name";
import { demoActions, useDemoState } from "@/features/demo/store";
import {
  RequireViewer,
  SettingsSection,
} from "@/features/settings/settings-shell";
import { getUserByIdSync } from "@/lib/data/users";

export function BlockedSettings() {
  const { blockedUserIds } = useDemoState();
  const users = blockedUserIds
    .map((id) => getUserByIdSync(id))
    .filter((user) => user !== undefined);

  return (
    <RequireViewer>
      {() => (
        <SettingsSection
          title="Blockierte Nutzer"
          description="Blockierte Personen sehen nicht, dass du sie blockiert hast. Ihre Beiträge und Kommentare werden dir nicht angezeigt."
        >
          {users.length === 0 ? (
            <EmptyState
              compact
              icon={BanIcon}
              title="Du hast niemanden blockiert"
              description="Blockieren kannst du über das Menü an Beiträgen, Kommentaren oder Profilen."
            />
          ) : (
            <ul className="divide-y rounded-md border">
              {users.map((user) => (
                <li key={user!.id} className="flex items-center gap-3 p-3">
                  <UserAvatar user={user} size="md" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={profileHref(user!)}
                      className="block truncate font-semibold hover:underline"
                    >
                      {user!.username}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {user!.displayName}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Blockierung von ${user!.username} aufheben`}
                    onClick={() => {
                      demoActions.toggleBlock(user!.id);
                      toast.success(
                        `Blockierung von ${user!.username} aufgehoben`,
                        {
                          action: {
                            label: "Rückgängig",
                            onClick: () => demoActions.toggleBlock(user!.id),
                          },
                        },
                      );
                    }}
                  >
                    Aufheben
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SettingsSection>
      )}
    </RequireViewer>
  );
}
