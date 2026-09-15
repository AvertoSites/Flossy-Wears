"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";

/**
 * Roles live on `users/{uid}` in Firestore, not as a Firebase custom claim —
 * there's no server (Admin SDK) in this app to grant claims, so the app
 * never sets role: "admin" itself (see firestore.rules). Admin accounts are
 * created and flagged manually in the Firebase console.
 */
export type UserRole = "customer" | "admin";

export type UserProfile = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
};

type Fallback = { email: string; firstName: string; lastName: string };

function toProfile(
  uid: string,
  data: Record<string, unknown>,
  fallback: Fallback,
): UserProfile {
  return {
    uid,
    firstName: (data.firstName as string) || fallback.firstName,
    lastName: (data.lastName as string) || fallback.lastName,
    email: (data.email as string) || fallback.email,
    role: data.role === "admin" ? "admin" : "customer",
  };
}

/** Reads the Firestore profile for a signed-in user. Null if none exists yet. */
export async function fetchUserProfile(
  uid: string,
  fallback: Fallback = { email: "", firstName: "", lastName: "" },
): Promise<UserProfile | null> {
  const snap = await getDoc(doc(firestore, "users", uid));
  if (!snap.exists()) return null;
  return toProfile(uid, snap.data(), fallback);
}

/**
 * Creates the profile doc for a brand-new customer sign-up. Role is always
 * "customer" — firestore.rules rejects any client write that sets role to
 * "admin", so this is the only role a sign-up can ever produce.
 */
export async function createCustomerProfile(params: {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<UserProfile> {
  await setDoc(doc(firestore, "users", params.uid), {
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    role: "customer",
    createdAt: serverTimestamp(),
  });
  return { ...params, role: "customer" };
}
