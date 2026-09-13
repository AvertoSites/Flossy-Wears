"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/lib/store/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuthed = useAdminAuth((s) => s.setAuthed);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setAuthed(true);
        router.replace("/admin");
      } else {
        setError("Incorrect passcode.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f4f1ea] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col gap-1">
          <span className="inline-flex items-center gap-2 font-display text-lg text-[#1e3a5f]">
            <LockIcon className="size-4" />
            Flossy Wears Admin
          </span>
          <p className="text-sm text-muted-foreground">
            Enter the team passcode to continue.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="passcode">Passcode</Label>
          <Input
            id="passcode"
            type="password"
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={loading}>
          {loading ? "Checking…" : "Sign in"}
        </Button>
        <p className="mt-4 rounded-md border border-dashed border-black/10 bg-[#f4f1ea] px-3 py-2 text-xs text-muted-foreground">
          Preview build passcode: <strong>flossy-admin</strong>. Not real
          security — replace with Firebase Auth + an admin claim.
        </p>
      </form>
    </div>
  );
}
