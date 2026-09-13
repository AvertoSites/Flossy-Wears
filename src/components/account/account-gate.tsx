"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { useMounted } from "@/lib/hooks/use-mounted";

/** Client-side guard for the mock account area. */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const user = useAuth((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (mounted && !user) router.replace("/account/login");
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return <div className="container-page py-24" />;
  }

  return <>{children}</>;
}
