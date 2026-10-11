import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthAction } from "@/components/account/auth-action";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default function AccountActionPage() {
  return (
    <Suspense fallback={<div className="container-page py-24" />}>
      <AuthAction />
    </Suspense>
  );
}
