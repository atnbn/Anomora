import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { VerifyEmailView } from "@/features/auth/components/verify-email-view";

export const metadata: Metadata = { title: "E-Mail bestätigen" };

export default function Page() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <VerifyEmailView />
    </Suspense>
  );
}
