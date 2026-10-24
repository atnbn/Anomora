"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProfileStep } from "@/features/onboarding/steps";
import { profileHref } from "@/features/profiles/components/user-name";
import {
  RequireViewer,
  SettingsSection,
} from "@/features/settings/settings-shell";

const FORM_ID = "settings-profile";

export function ProfileSettings() {
  return (
    <RequireViewer>
      {(viewer) => (
        <SettingsSection
          title="Profil"
          description={
            <>
              Diese Angaben sind auf deinem{" "}
              <Link
                href={profileHref(viewer)}
                className="font-semibold text-brand hover:underline"
              >
                öffentlichen Profil
              </Link>{" "}
              sichtbar.
            </>
          }
        >
          <ProfileStep
            key={viewer.id}
            viewer={viewer}
            formId={FORM_ID}
            onDone={() => toast.success("Profil gespeichert")}
          />
          <div className="mt-6 flex justify-end border-t pt-5">
            <Button type="submit" form={FORM_ID} size="lg">
              Änderungen speichern
            </Button>
          </div>
        </SettingsSection>
      )}
    </RequireViewer>
  );
}
