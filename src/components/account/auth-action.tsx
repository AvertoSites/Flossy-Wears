"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/common/password-field";
import { firebaseAuth } from "@/lib/firebase/client";
import { authErrorMessage } from "@/lib/firebase/errors";

/**
 * Handles the links in our verification / password-reset emails
 * (`?mode=verifyEmail|resetPassword&oobCode=…`, built by `/api/auth/email`)
 * on our own site rather than Firebase's hosted page, then sends the customer
 * back to sign-in.
 */
export function AuthAction() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode") ?? "";

  if (!oobCode || (mode !== "verifyEmail" && mode !== "resetPassword")) {
    return (
      <Shell title="Link not recognised">
        <Failed message="This link is incomplete. Please use the full link from your email, or request a new one." />
      </Shell>
    );
  }
  return mode === "verifyEmail" ? (
    <VerifyEmail oobCode={oobCode} />
  ) : (
    <ResetPassword oobCode={oobCode} />
  );
}

function VerifyEmail({ oobCode }: { oobCode: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Strict mode runs effects twice in dev — a code can only be applied once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    applyActionCode(firebaseAuth, oobCode)
      .then(async () => {
        await firebaseAuth.currentUser?.reload().catch(() => {});
        router.replace("/account/login?verified=1");
      })
      .catch((err) => setError(authErrorMessage(err)));
  }, [oobCode, router]);

  return (
    <Shell title={error ? "Couldn't verify your email" : "Verifying your email…"}>
      {error ? (
        <Failed message={`${error} Sign in and use "Resend verification email" to get a fresh link.`} />
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">One moment — taking you to sign in.</p>
      )}
    </Shell>
  );
}

function ResetPassword({ oobCode }: { oobCode: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verifyPasswordResetCode(firebaseAuth, oobCode)
      .then(setEmail)
      .catch((err) => setLinkError(authErrorMessage(err)));
  }, [oobCode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (values.password.length < 6) {
      setError("Please use a stronger password (6+ characters).");
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(firebaseAuth, oobCode, values.password);
      router.replace("/account/login?reset=1");
    } catch (err) {
      setError(authErrorMessage(err));
      setLoading(false);
    }
  }

  if (linkError) {
    return (
      <Shell title="Reset link not valid">
        <Failed message={linkError} reset />
      </Shell>
    );
  }
  if (!email) {
    return (
      <Shell title="Reset your password">
        <p className="mt-2 text-sm text-muted-foreground">Checking your link…</p>
      </Shell>
    );
  }

  return (
    <Shell title="Choose a new password">
      <p className="mt-1 text-sm text-muted-foreground">
        For <strong className="text-foreground">{email}</strong>
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        />
        <PasswordField
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={6}
          value={values.confirmPassword}
          onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Failed({ message, reset }: { message: string; reset?: boolean }) {
  return (
    <>
      <p className="mt-4 text-sm text-destructive">{message}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        {reset && (
          <>
            <Link href="/account/forgot-password" className="text-navy underline underline-offset-4">
              Send a new reset link
            </Link>{" "}
            or{" "}
          </>
        )}
        <Link href="/account/login" className="text-navy underline underline-offset-4">
          {reset ? "back to sign in" : "Go to sign in"}
        </Link>
      </p>
    </>
  );
}
