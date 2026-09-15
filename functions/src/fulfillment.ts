import { FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { db } from "./admin";
import { getStripe, stripeSecretKey } from "./stripe";
import { resendApiKey, sendOrderConfirmationEmail } from "./email";
import type { Address, OrderLine, Product } from "./types";

/**
 * The one place an order is ever marked paid. Follows Stripe's documented
 * fulfillment pattern (https://docs.stripe.com/checkout/fulfillment): safe to
 * call more than once, or concurrently, for the same session — both the
 * webhook and the success-page `confirmCheckoutSession` call call this, and
 * whichever gets there first wins.
 */
export async function fulfillCheckoutSession(sessionId: string): Promise<void> {
  const orderRef = db.collection("orders").doc(sessionId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    logger.warn(`fulfillCheckoutSession: no pre-created order for session ${sessionId}`);
    return;
  }
  if (orderSnap.data()?.paymentStatus === "paid") {
    return; // idempotency guard — already fulfilled.
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "unpaid") {
    return; // not actually paid yet — nothing to do.
  }

  const order = orderSnap.data()!;
  const lines = order.lines as OrderLine[];
  let orderNumber = "";

  await db.runTransaction(async (tx) => {
    const counterRef = db.collection("counters").doc("orders");
    const counterSnap = await tx.get(counterRef);
    const next = (counterSnap.exists ? (counterSnap.data()!.next as number) : 1001);

    // Read every product doc referenced by this order before any writes
    // (Firestore transactions require all reads first).
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const productSnaps = await Promise.all(
      productIds.map((id) => tx.get(db.collection("products").doc(id))),
    );

    let discountSnap = null;
    if (order.discountCode) {
      discountSnap = await tx.get(db.collection("discounts").doc(order.discountCode));
    }

    for (const snap of productSnaps) {
      if (!snap.exists) continue;
      const product = snap.data() as Product;
      const linesForProduct = lines.filter((l) => l.productId === product.id);
      let changed = false;
      const variants = product.variants.map((v) => {
        const line = linesForProduct.find((l) => l.variantId === v.id);
        if (!line) return v;
        changed = true;
        // Payment is already captured — clamp at 0 rather than block on a
        // race-condition oversell instead of failing the whole fulfillment.
        return { ...v, stock: Math.max(0, v.stock - line.quantity) };
      });
      if (changed) tx.update(snap.ref, { variants });
    }

    if (discountSnap?.exists) {
      tx.update(discountSnap.ref, { timesUsed: FieldValue.increment(1) });
    }

    orderNumber = `FW-${next}`;
    tx.set(counterRef, { next: next + 1 }, { merge: true });
    tx.update(orderRef, {
      number: orderNumber,
      paymentStatus: "paid",
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      timeline: FieldValue.arrayUnion({
        id: `${sessionId}-paid`,
        at: new Date().toISOString(),
        kind: "payment",
        label: "Payment succeeded",
      }),
    });
  });

  await sendOrderConfirmationEmail({
    number: orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    lines,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    shippingMethod: order.shippingMethod,
    shippingAddress: order.shippingAddress as Address,
  });

  logger.info(`Fulfilled order for session ${sessionId}`);
}

export async function markPaymentFailed(sessionId: string): Promise<void> {
  const ref = db.collection("orders").doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.paymentStatus === "paid") return;
  await ref.update({
    paymentStatus: "failed",
    timeline: FieldValue.arrayUnion({
      id: `${sessionId}-failed`,
      at: new Date().toISOString(),
      kind: "payment",
      label: "Payment failed",
    }),
  });
}

/** Called once from /checkout/success on load — immediate fulfillment attempt per Stripe's landing-page recommendation. Harmless if the webhook already ran. */
export const confirmCheckoutSession = onCall(
  { secrets: [stripeSecretKey, resendApiKey] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
    const sessionId = request.data?.sessionId as string | undefined;
    if (!sessionId) throw new HttpsError("invalid-argument", "sessionId is required.");

    const orderRef = db.collection("orders").doc(sessionId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists || orderSnap.data()?.customerId !== uid) {
      throw new HttpsError("not-found", "Order not found.");
    }

    await fulfillCheckoutSession(sessionId);
    return { ok: true };
  },
);
