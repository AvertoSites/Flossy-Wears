"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";

/**
 * Client-side guard for the admin panel. Real enforcement for admin data
 * still needs to move behind Firestore Security Rules keyed on this same
 * `users/{uid}.role` field (see firestore.rules) — this gate only controls
 * what the admin UI shows, it isn't the security boundary by itself.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const status = useAuth((s) => s.status);
  const role = useAuth((s) => s.user?.role);
  const router = useRouter();

  const isAdmin = status === "signed-in" && role === "admin";

  useEffect(() => {
    if (status !== "loading" && !isAdmin) router.replace("/admin/login");
  }, [status, isAdmin, router]);

  if (!isAdmin) {
    return <div className="min-h-screen bg-[#f4f1ea]" />;
  }

  return <>{children}</>;
}
