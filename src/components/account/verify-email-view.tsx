"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getIdToken, reload, sendEmailVerification } from "firebase/auth";
import { MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/store/auth";

export function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const status = useAuth((s) => s.status);
  const emailVerified = useAuth((s) => s.emailVerified);
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const signOut = useAuth((s) => s.signOut);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "signed-out") router.replace("/account/login");
    else if (status === "signed-in" && emailVerified) router.replace(redirect);
  }, [status, emailVerified, router, redirect]);

  async function resend() {
    const current = firebaseAuth.currentUser;
    if (!current) return;
    setSending(true);
    setError(null);
    try {
      await sendEmailVerification(current);
      setSent(true);
    } catch {
      setError("Couldn't send the email right now — try again shortly.");
    } finally {
      setSending(false);
    }
  }

  async function checkVerified() {
    const current = firebaseAuth.currentUser;
    if (!current) return;
    setChecking(true);
    setError(null);
    try {
      await reload(current);
      if (current.emailVerified) {
        // `reload()` only refreshes the local user profile — the cached ID
        // token's `email_verified` claim (what Cloud Functions actually
        // check) doesn't update until a fresh token is minted.
        await getIdToken(current, true);
        setUser(user, true);
        router.replace(redirect);
      } else {
        setError("Still not verified — check your inbox (and spam folder).");
      }
    } finally {
      setChecking(false);
    }
  }

  if (status !== "signed-in") {
    return <div className="container-page py-24" />;
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm text-center">
        <MailCheckIcon className="mx-auto size-10 text-gold-dark" />
        <h1 className="mt-4 text-2xl">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <strong className="text-foreground">{user?.email}</strong>. Click it
          to activate your account — if it&rsquo;s not in your inbox within a
          few minutes, check your spam folder.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={checkVerified} disabled={checking}>
            {checking ? "Checking…" : "I've verified — continue"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={resend}
            disabled={sending || sent}
          >
            {sent ? "Email sent" : sending ? "Sending…" : "Resend email"}
          </Button>
        </div>
        <button
          type="button"
          onClick={() => {
            signOut();
            router.push("/");
          }}
          className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
