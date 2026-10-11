import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/account/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="container-page py-24" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
