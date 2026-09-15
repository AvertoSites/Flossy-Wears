import { adminDb } from "@/lib/firebase/admin";
import type { Order } from "@/types";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 20;

/** Unauthenticated order-number + email lookup — cheap to guess at scale, so rate-limited per IP. */
async function checkRateLimit(ip: string): Promise<boolean> {
  const ref = adminDb.collection("rate_limits").doc(`track:${ip}`);
  const now = Date.now();
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { count: number; windowStart: number } | undefined;
    if (!data || now - data.windowStart > WINDOW_MS) {
      tx.set(ref, { count: 1, windowStart: now });
      return true;
    }
    if (data.count >= MAX_ATTEMPTS) return false;
    tx.update(ref, { count: data.count + 1 });
    return true;
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return Response.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    orderNumber?: string;
    email?: string;
  } | null;

  const orderNumber = body?.orderNumber?.trim().toUpperCase();
  const email = body?.email?.trim().toLowerCase();

  if (!orderNumber || !email) {
    return Response.json(
      { error: "Enter your order number and email." },
      { status: 400 },
    );
  }

  const snap = await adminDb
    .collection("orders")
    .where("number", "==", orderNumber)
    .limit(1)
    .get();

  const order = snap.empty ? null : (snap.docs[0].data() as Order);
  if (!order || order.customerEmail?.toLowerCase() !== email) {
    return Response.json(
      { error: "We couldn't find an order with those details." },
      { status: 404 },
    );
  }

  return Response.json({
    number: order.number,
    status: order.status,
    placedAt: order.placedAt,
    carrier: order.carrier ?? null,
    trackingNumber: order.trackingNumber ?? null,
    trackingUrl: order.trackingUrl ?? null,
    shippedAt: order.shippedAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    lines: order.lines.map((l) => ({
      name: l.name,
      colourLabel: l.colourLabel,
      size: l.size,
      quantity: l.quantity,
      image: l.image,
    })),
    timeline: (order.timeline ?? []).filter((e) =>
      ["placed", "fulfillment", "refund"].includes(e.kind),
    ),
  });
}
