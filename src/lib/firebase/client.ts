"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase Web SDK config. These values are public by design (they identify
 * the project to Firebase, not a secret) — real access control lives in
 * Firestore/Storage security rules and in server-side custom-claim checks,
 * never in hiding this object.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

// Explicit, rather than relying on the SDK default: keep the signed-in
// session in local storage so a visitor stays signed in across tabs and
// browser restarts, not just for the current tab session.
if (typeof window !== "undefined") {
  setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {});
}

/**
 * Analytics needs `window` and isn't supported in every environment (SSR,
 * some browsers/extensions block it) — load and init it lazily, client-side
 * only, and never let it throw.
 */
export async function initAnalytics() {
  if (typeof window === "undefined") return;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  if (await isSupported().catch(() => false)) {
    getAnalytics(firebaseApp);
  }
}
