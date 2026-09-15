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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        return;
      }
      const [firstName, ...rest] = (fbUser.displayName ?? "").split(" ");
      const fallback = {
        email: fbUser.email ?? "",
        firstName: firstName || "",
        lastName: rest.join(" "),
      };
      const profile = await fetchUserProfile(fbUser.uid, fallback);
      setUser(
        profile ?? { uid: fbUser.uid, role: "customer", ...fallback },
        fbUser.emailVerified,
      );
    });
    return unsubscribe;
  }, [setUser]);

  return null;
}
