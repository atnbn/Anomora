import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSkeleton } from "@/features/auth/components/auth-skeleton";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Registrieren" };

export default function Page() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}
