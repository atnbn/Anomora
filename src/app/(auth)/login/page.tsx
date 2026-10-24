import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default function Page() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
