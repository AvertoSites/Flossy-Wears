"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";

/** Client-side guard for the account area — requires sign-in and a verified email. */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const status = useAuth((s) => s.status);
  const emailVerified = useAuth((s) => s.emailVerified);
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-out") router.replace("/account/login");
    else if (status === "signed-in" && !emailVerified) {
      router.replace("/account/verify-email");
    }
  }, [status, emailVerified, router]);

  if (status !== "signed-in" || !emailVerified) {
    return <div className="container-page py-24" />;
  }

  return <>{children}</>;
}
