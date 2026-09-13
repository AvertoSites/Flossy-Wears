"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/store/admin-auth";
import { useMounted } from "@/lib/hooks/use-mounted";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const authed = useAdminAuth((s) => s.authed);
  const router = useRouter();

  useEffect(() => {
    if (mounted && !authed) router.replace("/admin/login");
  }, [mounted, authed, router]);

  if (!mounted || !authed) {
    return <div className="min-h-screen bg-[#f4f1ea]" />;
  }

  return <>{children}</>;
}
