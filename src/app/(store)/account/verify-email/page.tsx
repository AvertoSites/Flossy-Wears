import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailView } from "@/components/account/verify-email-view";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="container-page py-24" />}>
      <VerifyEmailView />
    </Suspense>
  );
}
