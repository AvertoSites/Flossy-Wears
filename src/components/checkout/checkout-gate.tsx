"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";

/** Checkout requires a signed-in, verified account — every order is created with customerId = auth.uid. */
export function CheckoutGate({ children }: { children: React.ReactNode }) {
  const status = useAuth((s) => s.status);
  const emailVerified = useAuth((s) => s.emailVerified);
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-out") router.replace("/account/login?redirect=/checkout");
    else if (status === "signed-in" && !emailVerified) {
      router.replace("/account/verify-email?redirect=/checkout");
    }
  }, [status, emailVerified, router]);

  if (status !== "signed-in" || !emailVerified) {
    return <div className="container-page py-24" />;
  }

  return <>{children}</>;
}
