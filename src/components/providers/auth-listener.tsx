"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { fetchUserProfile } from "@/lib/firebase/user-doc";
import { useAuth } from "@/lib/store/auth";

/**
 * Bridges Firebase's own auth state into `useAuth`. Mounted once in
 * `providers.tsx`. Only reads the Firestore profile — it never creates one,
 * so it's safe for accounts that don't have a doc yet (e.g. an admin created
 * directly in the Firebase console before their `users/{uid}` doc exists;
 * such an account is treated as role "customer" until that doc is added).
 */
export function AuthListener() {
  const setUser = useAuth((s) => s.setUser);
  const setLoading = useAuth((s) => s.setLoading);

  useEffect(() => {
    // Uid of the most recent auth event — a slow profile fetch for an earlier
    // event must not overwrite a later sign-in/sign-out.
    let latestUid: string | null = null;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      latestUid = fbUser?.uid ?? null;
      if (!fbUser) {
        setUser(null);
        return;
      }
      // Signed in to Firebase but the profile isn't loaded yet — hold gates
      // in "loading" so they don't treat the gap as signed-out.
      setLoading();
      const [firstName, ...rest] = (fbUser.displayName ?? "").split(" ");
      const fallback = {
        email: fbUser.email ?? "",
        firstName: firstName || "",
        lastName: rest.join(" "),
      };
      // A failed read (offline, rules) mustn't leave the app stuck in "loading".
      const profile = await fetchUserProfile(fbUser.uid, fallback).catch(() => null);
      if (latestUid !== fbUser.uid) return;
      setUser(
        profile ?? { uid: fbUser.uid, role: "customer", ...fallback },
        fbUser.emailVerified,
      );
    });
    return unsubscribe;
  }, [setUser, setLoading]);

  return null;
}
