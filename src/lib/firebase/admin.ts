import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * Server-only Firebase Admin SDK — bypasses Firestore Security Rules, so this
 * must never be imported from a "use client" file. Used for: public catalog
 * reads at request time (products/collections/settings), every `/api/admin/*`
 * route (via `requireAdmin`, see `src/lib/server/require-admin.ts`), and the
 * seed script.
 *
 * `FIREBASE_SERVICE_ACCOUNT_KEY` is the full JSON key from Firebase Console ->
 * Project settings -> Service accounts -> Generate new private key, minified
 * to one line (`JSON.stringify` it) when pasting into `.env.local` / hosting
 * env vars. Never commit it, never prefix it with `NEXT_PUBLIC_`.
 */
function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set — see .env.example.",
    );
  }
  try {
    return JSON.parse(raw) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON — paste the whole service-account key file contents as a single line.",
    );
  }
}

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];
  const account = loadServiceAccount();
  return initializeApp({
    credential: cert({
      projectId: account.project_id,
      clientEmail: account.client_email,
      privateKey: account.private_key,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const app = getAdminApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
// Product/order docs legitimately have unset optional fields (compareAtPrice,
// customVerse, ...) — without this, any `undefined` value throws instead of
// just omitting the field. Guarded because dev-mode HMR can re-run this
// module against an already-initialized Firestore singleton.
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // already configured — fine.
}

/**
 * Recursively drops `undefined` values before a write. `ignoreUndefinedProperties`
 * above only covers plain object fields — the Admin SDK still rejects
 * `undefined` nested inside array elements — so anything hand-built with
 * optional fields inside an array (order lines, product variants, ...)
 * should be passed through this before `.set()`/`.update()`, rather than
 * relying on the instance setting alone.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value instanceof FieldValue) return value;
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefinedDeep(v);
    }
    return out as T;
  }
  return value;
}
