import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Inside Cloud Functions, `initializeApp()` with no args picks up the
 * function's own runtime service account automatically — no key file needed
 * here (unlike the Next.js side, which isn't running inside GCP).
 */
const app = initializeApp();

export const db = getFirestore(app);
// Order/line docs legitimately have unset optional fields (customVerse, ...).
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch {
  // already configured — fine.
}
