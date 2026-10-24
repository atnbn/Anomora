import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { ForgotPasswordForm } from "@/features/auth/components/password-reset";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function Page() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
