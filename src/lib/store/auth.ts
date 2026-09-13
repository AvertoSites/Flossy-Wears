"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Mock auth for the preview build. Firebase Auth replaces this later —
 * keep `user`, `signIn`, `signOut` and swap the implementation.
 */
type AuthUser = { firstName: string; lastName: string; email: string };

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
    }),
    {
      name: "flossywears-auth",
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (s) => {
        if (s) s.hydrated = true;
      },
    },
  ),
);
