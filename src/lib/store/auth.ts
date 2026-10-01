"use client";

import { create } from "zustand";
import { signOut as firebaseSignOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/firebase/user-doc";

/**
 * Real auth state, sourced from Firebase Auth + the user's `users/{uid}`
 * Firestore doc. `AuthListener` (mounted in providers.tsx) is what actually
 * populates this via `onAuthStateChanged` — this store is just the reactive
 * container so components can read it the same way as before.
 */
type AuthStatus = "loading" | "signed-out" | "signed-in";

type AuthState = {
  user: UserProfile | null;
  /** Firebase Auth's own emailVerified flag — required before AccountGate lets a customer in. */
  emailVerified: boolean;
  status: AuthStatus;
  setUser: (user: UserProfile | null, emailVerified?: boolean) => void;
  /** Firebase has a user but their profile is still being fetched — gates must wait, not redirect. */
  setLoading: () => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  emailVerified: false,
  status: "loading",
  setUser: (user, emailVerified = false) =>
    set({ user, emailVerified, status: user ? "signed-in" : "signed-out" }),
  setLoading: () => set({ status: "loading" }),
  signOut: () => {
    firebaseSignOut(firebaseAuth).catch(() => {});
  },
}));

/**
 * Resolves once `AuthListener` has finished loading `uid` into this store.
 * Sign-in flows must await this before navigating: Firebase's sign-in promise
 * resolves before the store catches up, and a route gate that renders in that
 * gap sees "signed-out" and bounces the user straight back to the login page.
 * Times out rather than hanging the form if the listener never settles.
 */
export function waitForAuthUser(uid: string, timeoutMs = 10_000): Promise<void> {
  const ready = (s: AuthState) => s.status === "signed-in" && s.user?.uid === uid;
  if (ready(useAuth.getState())) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      unsubscribe();
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    const unsubscribe = useAuth.subscribe((s) => {
      if (ready(s)) finish();
    });
  });
}

/** Only same-site paths — `?redirect=` comes from the URL, so never let it send users off-site. */
export function safeRedirect(path: string | null, fallback: string): string {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}
