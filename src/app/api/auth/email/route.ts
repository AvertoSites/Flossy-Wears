import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { sendAccountEmail } from "@/lib/email/resend";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

/** Same Firestore-backed fixed window as `/api/track` — stops this being used to spam an inbox. */
async function checkRateLimit(key: string, max: number): Promise<boolean> {
  const ref = adminDb.collection("rate_limits").doc(key);
  const now = Date.now();
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { count: number; windowStart: number } | undefined;
    if (!data || now - data.windowStart > WINDOW_MS) {
      tx.set(ref, { count: 1, windowStart: now });
      return true;
    }
    if (data.count >= max) return false;
    tx.update(ref, { count: data.count + 1 });
    return true;
  });
}

/**
 * Generates the Firebase action link, then points it at our own
 * `/account/action` page (which applies the code with the client SDK) instead
 * of Firebase's hosted handler — so customers stay on our site and land
 * straight back on sign-in.
 */
async function actionLink(kind: "verify" | "reset", email: string, origin: string) {
  const link = kind === "verify"
    ? await adminAuth.generateEmailVerificationLink(email)
    : await adminAuth.generatePasswordResetLink(email);
  const params = new URL(link).searchParams;
  const oobCode = params.get("oobCode");
  if (!oobCode) return link;
  const ours = new URLSearchParams({
    mode: params.get("mode") ?? (kind === "verify" ? "verifyEmail" : "resetPassword"),
    oobCode,
  });
  return `${origin}/account/action?${ours}`;
}

/**
 * Unauthenticated: sends a verification or password-reset email via Resend.
 * Always answers `{ ok: true }` for unknown/already-verified emails so the
 * form can't be used to discover who has an account.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    kind?: string;
    email?: string;
  } | null;
  const kind = body?.kind;
  const email = body?.email?.trim().toLowerCase();

  if ((kind !== "verify" && kind !== "reset") || !email || !email.includes("@")) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed =
    (await checkRateLimit(`auth-email:ip:${ip}`, MAX_PER_IP)) &&
    (await checkRateLimit(`auth-email:${email}`, MAX_PER_EMAIL));
  if (!allowed) {
    return Response.json(
      { error: "Too many emails requested. Please wait a while and try again." },
      { status: 429 },
    );
  }

  let user;
  try {
    user = await adminAuth.getUserByEmail(email);
  } catch {
    return Response.json({ ok: true });
  }
  if (kind === "verify" && user.emailVerified) return Response.json({ ok: true });

  const origin = new URL(request.url).origin;
  const link = await actionLink(kind, email, origin);
  const result = await sendAccountEmail({ to: email, kind, link });
  if (!result.sent) {
    console.error(`[auth-email] ${kind} email to ${email} failed:`, result.error);
    return Response.json(
      { error: "We couldn't send the email right now. Please try again shortly." },
      { status: 502 },
    );
  }
  return Response.json({ ok: true });
}
