"use client";

import { ErrorState } from "@/components/feedback/states";
import { PageContainer } from "@/components/layout/app-shell";

export default function PlatformError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <PageContainer>
      <ErrorState
        title="Diese Seite konnte nicht geladen werden"
        description="Ein unerwarteter Fehler ist aufgetreten. Versuche es erneut – deine lokalen Demo-Daten bleiben erhalten."
        onRetry={retry}
        className="mx-auto max-w-xl"
      />
    </PageContainer>
  );
}
