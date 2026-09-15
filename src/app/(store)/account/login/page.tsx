import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page py-24" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
