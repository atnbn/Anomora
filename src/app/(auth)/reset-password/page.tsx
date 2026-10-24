import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { ResetPasswordForm } from "@/features/auth/components/password-reset";

export const metadata: Metadata = { title: "Neues Passwort" };

export default function Page() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
