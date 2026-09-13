"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Mock admin session. Not real security — the passcode check happens in
 * `/api/admin/login` and this only remembers that it passed. Replace with
 * Firebase Auth + a custom `admin` claim (and server-side route protection).
 */
type AdminAuthState = {
  authed: boolean;
  hydrated: boolean;
  setAuthed: (value: boolean) => void;
};

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      authed: false,
      hydrated: false,
      setAuthed: (value) => set({ authed: value }),
    }),
    {
      name: "flossywears-admin",
      partialize: (s) => ({ authed: s.authed }),
      onRehydrateStorage: () => (s) => {
        if (s) s.hydrated = true;
      },
    },
  ),
);
