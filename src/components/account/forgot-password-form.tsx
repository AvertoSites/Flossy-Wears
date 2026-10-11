"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { requestAccountEmail } from "@/lib/account-email";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await requestAccountEmail("reset", trimmed);
      setSentTo(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your account email and we&rsquo;ll send you a link to choose a new password.
        </p>

        {sentTo ? (
          <div className="mt-6 flex gap-2 rounded-md border border-border bg-card p-3 text-sm">
            <span className="mt-0.5 shrink-0 text-gold-dark">
              <MailIcon className="size-4" />
            </span>
            <p>
              If there&rsquo;s an account for <strong>{sentTo}</strong>, a reset link is on its
              way. It expires in 1 hour — check your spam folder if you can&rsquo;t see it.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/account/login" className="text-navy underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
