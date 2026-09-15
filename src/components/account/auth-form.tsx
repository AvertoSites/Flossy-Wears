"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { PasswordField } from "@/components/common/password-field";
import { firebaseAuth } from "@/lib/firebase/client";
import { createCustomerProfile } from "@/lib/firebase/user-doc";
import { authErrorMessage } from "@/lib/firebase/errors";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
        await sendEmailVerification(cred.user);
        router.push(`/account/verify-email?redirect=${encodeURIComponent(redirect)}`);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, values.email, values.password);
        router.push(redirect);
      }
    } catch (err) {
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
