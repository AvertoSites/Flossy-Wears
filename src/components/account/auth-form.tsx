"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { CircleCheckIcon, MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { PasswordField } from "@/components/common/password-field";
import { firebaseAuth } from "@/lib/firebase/client";
import { createCustomerProfile } from "@/lib/firebase/user-doc";
import { authErrorMessage } from "@/lib/firebase/errors";
import { requestAccountEmail } from "@/lib/account-email";
import { safeRedirect, useAuth, waitForAuthUser } from "@/lib/store/auth";

/**
 * Sends the verification email through our own mailer (see
 * `/api/auth/email`) — Firebase's default sender is often blocked by
 * providers like BT. Falls back to Firebase's email if that fails, and to
 * its plain email if this site's domain isn't on the Auth authorised domains
 * list (which rejects a continue URL).
 */
async function sendVerification(user: User) {
  try {
    await requestAccountEmail("verify", user.email!);
  } catch {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/account/login?verified=1`,
    }).catch(() => sendEmailVerification(user));
  }
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"), "/account");
  const status = useAuth((s) => s.status);
  const emailVerified = useAuth((s) => s.emailVerified);
  // Set by registration (?verify=sent) or by the link in the verification email (?verified=1).
  const justRegistered = searchParams.get("verify") === "sent";
  const justVerified = searchParams.get("verified") === "1";
  // Set by the link in the password reset email.
  const justReset = searchParams.get("reset") === "1";
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: justRegistered ? (searchParams.get("email") ?? "") : "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Sign-in was refused because the email isn't verified yet.
  const [unverified, setUnverified] = useState(false);
  const [resend, setResend] = useState<"idle" | "sending" | "sent">("idle");
  // Register was refused because the email is taken (and the password didn't sign them in).
  const [emailTaken, setEmailTaken] = useState(false);

  const isRegister = mode === "register";

  // Already signed in (or just finished signing in) — skip the login form.
  // Register handles its own navigation, since it must finish creating the
  // profile and sending the verification email first.
  useEffect(() => {
    if (!isRegister && status === "signed-in" && emailVerified) router.replace(redirect);
  }, [isRegister, status, emailVerified, router, redirect]);

  async function resendVerification() {
    setResend("sending");
    setError(null);
    try {
      await requestAccountEmail("verify", values.email);
      setResend("sent");
    } catch (err) {
      setResend("idle");
      setError(err instanceof Error ? err.message : authErrorMessage(err));
    }
  }

  /**
   * Register hit an existing account — usually someone who signed up before
   * but never got (or clicked) the verification email. If the password they
   * just typed is right, pick up where they left off instead of dead-ending.
   */
  async function recoverExistingAccount(): Promise<boolean> {
    try {
      const cred = await signInWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password,
      );
      if (cred.user.emailVerified) {
        await waitForAuthUser(cred.user.uid);
        router.replace(redirect);
        return true;
      }
      await sendVerification(cred.user);
      await signOut(firebaseAuth);
      const params = new URLSearchParams({ verify: "sent", email: values.email, redirect });
      router.replace(`/account/login?${params}`);
      return true;
    } catch {
      await signOut(firebaseAuth).catch(() => {});
      return false;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setEmailTaken(false);
    setResend("idle");

    if (isRegister) {
      if (!values.firstName.trim() || !values.lastName.trim()) {
        setError("Enter your first and last name.");
        return;
      }
      if (values.password !== values.confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const firstName = values.firstName.trim();
        const lastName = values.lastName.trim();
        const cred = await createUserWithEmailAndPassword(
          firebaseAuth,
          values.email,
          values.password,
        );
        await updateProfile(cred.user, {
          displayName: `${firstName} ${lastName}`.trim(),
        });
        await createCustomerProfile({
          uid: cred.user.uid,
          email: values.email,
          firstName,
          lastName,
        });
        await sendVerification(cred.user);
        // No access until the email is verified — they sign in afterwards.
        await signOut(firebaseAuth);
        const params = new URLSearchParams({ verify: "sent", email: values.email, redirect });
        router.replace(`/account/login?${params}`);
      } else {
        const cred = await signInWithEmailAndPassword(
          firebaseAuth,
          values.email,
          values.password,
        );
        if (!cred.user.emailVerified) {
          await signOut(firebaseAuth);
          setUnverified(true);
          return;
        }
        await waitForAuthUser(cred.user.uid);
        router.replace(redirect);
      }
    } catch (err) {
      if (
        isRegister &&
        err instanceof FirebaseError &&
        err.code === "auth/email-already-in-use"
      ) {
        if (await recoverExistingAccount()) return;
        setEmailTaken(true);
        return;
      }
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl">
          {isRegister ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRegister
            ? "Save your details and track orders."
            : "Welcome back to Flossy Wears."}
        </p>

        {!isRegister && justRegistered && !unverified && (
          <Notice icon={<MailIcon className="size-4" />}>
            Account created. We&rsquo;ve sent a verification link to{" "}
            <strong>{searchParams.get("email")}</strong> — click it, then sign in
            here. Can&rsquo;t see it? Check your spam folder.
          </Notice>
        )}
        {!isRegister && justVerified && !unverified && (
          <Notice icon={<CircleCheckIcon className="size-4" />}>
            Email verified — sign in to continue.
          </Notice>
        )}
        {!isRegister && justReset && (
          <Notice icon={<CircleCheckIcon className="size-4" />}>
            Password updated — sign in with your new password.
          </Notice>
        )}

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          {isRegister && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="First name"
                name="firstName"
                autoComplete="given-name"
                value={values.firstName}
                onChange={(e) =>
                  setValues((v) => ({ ...v, firstName: e.target.value }))
                }
              />
              <TextField
                label="Last name"
                name="lastName"
                autoComplete="family-name"
                value={values.lastName}
                onChange={(e) =>
                  setValues((v) => ({ ...v, lastName: e.target.value }))
                }
              />
            </div>
          )}
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 6 : undefined}
            value={values.password}
            onChange={(e) =>
              setValues((v) => ({ ...v, password: e.target.value }))
            }
          />
          {!isRegister && (
            <Link
              href={`/account/forgot-password${values.email ? `?email=${encodeURIComponent(values.email)}` : ""}`}
              className="-mt-2 self-end text-sm text-navy underline underline-offset-4"
            >
              Forgot password?
            </Link>
          )}
          {isRegister && (
            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={6}
              value={values.confirmPassword}
              onChange={(e) =>
                setValues((v) => ({ ...v, confirmPassword: e.target.value }))
              }
            />
          )}
          {unverified && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="text-destructive">
                Please verify your email before signing in. Click the link we
                sent to <strong>{values.email}</strong> (check your spam folder too).
              </p>
              <button
                type="button"
                onClick={resendVerification}
                disabled={resend !== "idle"}
                className="mt-2 text-navy underline underline-offset-4 disabled:no-underline disabled:opacity-70"
              >
                {resend === "sent"
                  ? "Verification email sent"
                  : resend === "sending"
                    ? "Sending…"
                    : "Resend verification email"}
              </button>
            </div>
          )}
          {emailTaken && (
            <p className="text-sm text-destructive">
              An account with that email already exists.{" "}
              <Link
                href={`/account/login?redirect=${encodeURIComponent(redirect)}`}
                className="text-navy underline underline-offset-4"
              >
                Sign in
              </Link>{" "}
              or{" "}
              <Link
                href={`/account/forgot-password?email=${encodeURIComponent(values.email)}`}
                className="text-navy underline underline-offset-4"
              >
                reset your password
              </Link>
              .
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading
              ? isRegister
                ? "Creating account…"
                : "Signing in…"
              : isRegister
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link
                href={`/account/login?redirect=${encodeURIComponent(redirect)}`}
                className="text-navy underline underline-offset-4"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href={`/account/register?redirect=${encodeURIComponent(redirect)}`}
                className="text-navy underline underline-offset-4"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Notice({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-6 flex gap-2 rounded-md border border-border bg-card p-3 text-sm">
      <span className="mt-0.5 shrink-0 text-gold-dark">{icon}</span>
      <p>{children}</p>
    </div>
  );
}
