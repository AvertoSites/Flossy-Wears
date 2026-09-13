"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { useAuth } from "@/lib/store/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const isRegister = mode === "register";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn({
      firstName: values.firstName || "Amara",
      lastName: values.lastName || "Okafor",
      email: values.email || "amara@example.com",
    });
    router.push("/account");
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

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {isRegister && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="First name"
                name="firstName"
                value={values.firstName}
                onChange={(e) =>
                  setValues((v) => ({ ...v, firstName: e.target.value }))
                }
              />
              <TextField
                label="Last name"
                name="lastName"
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
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={values.password}
            onChange={(e) =>
              setValues((v) => ({ ...v, password: e.target.value }))
            }
          />
          <Button type="submit" size="lg">
            {isRegister ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link href="/account/login" className="text-navy underline underline-offset-4">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href="/account/register"
                className="text-navy underline underline-offset-4"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
        <p className="mt-6 rounded-md border border-dashed border-border bg-cream/50 px-3 py-2 text-xs text-muted-foreground">
          Preview build — any details sign you in as a demo customer.
        </p>
      </div>
    </div>
  );
}
