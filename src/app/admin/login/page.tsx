"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockIcon } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { firebaseAuth } from "@/lib/firebase/client";
import { fetchUserProfile } from "@/lib/firebase/user-doc";
import { authErrorMessage } from "@/lib/firebase/errors";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const profile = await fetchUserProfile(cred.user.uid, {
        email: cred.user.email ?? email,
        firstName: "",
        lastName: "",
      });
      if (profile?.role !== "admin") {
        await signOut(firebaseAuth);
        setError("This account doesn't have admin access.");
        return;
      }
      router.replace("/admin");
    } catch (err) {
      setError(authErrorMessage(err));
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
            Sign in with your admin account to continue.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="mt-4 rounded-md border border-dashed border-black/10 bg-[#f4f1ea] px-3 py-2 text-xs text-muted-foreground">
          Admin accounts are created manually in the Firebase console — there&rsquo;s
          no self-service sign-up here.
        </p>
      </form>
    </div>
  );
}
