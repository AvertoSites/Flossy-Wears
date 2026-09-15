import "server-only";

import { adminAuth, adminDb } from "@/lib/firebase/admin";

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Verifies the `Authorization: Bearer <idToken>` header every `/api/admin/*`
 * route now requires, and checks the caller's `users/{uid}.role == "admin"`
 * doc (the same field Firestore rules key off of — see `firestore.rules`).
 * Throws `AdminAuthError` on any failure; callers should catch it and return
 * `Response.json({ error: err.message }, { status: err.status })`.
 */
export async function requireAdmin(request: Request): Promise<{ uid: string }> {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AdminAuthError("Missing bearer token", 401);
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    throw new AdminAuthError("Invalid or expired token", 401);
  }

  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists || snap.data()?.role !== "admin") {
    throw new AdminAuthError("Admin access required", 403);
  }

  return { uid };
}

/** Wraps a route handler body: verifies admin auth first, converts AdminAuthError to the right status. */
export async function withAdmin(
  request: Request,
  handler: (admin: { uid: string }) => Promise<Response>,
): Promise<Response> {
  try {
    const admin = await requireAdmin(request);
    return await handler(admin);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
