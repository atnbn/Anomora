"use client";

import { AppearanceStep } from "@/features/onboarding/steps";
import {
  RequireViewer,
  SettingsSection,
} from "@/features/settings/settings-shell";

export function AppearanceSettings() {
  return (
    <RequireViewer>
      {() => (
        <SettingsSection
          title="Darstellung"
          description="Änderungen werden sofort übernommen und auf diesem Gerät gespeichert."
        >
          <AppearanceStep formId="settings-appearance" onDone={() => {}} />
        </SettingsSection>
      )}
    </RequireViewer>
  );
}
