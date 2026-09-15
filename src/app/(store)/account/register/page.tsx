import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/account/auth-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="container-page py-24" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
