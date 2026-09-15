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
  signOut: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  emailVerified: false,
  status: "loading",
  setUser: (user, emailVerified = false) =>
    set({ user, emailVerified, status: user ? "signed-in" : "signed-out" }),
  signOut: () => {
    firebaseSignOut(firebaseAuth).catch(() => {});
  },
}));
