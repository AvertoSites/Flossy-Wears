import { FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./admin";
import { getStripe, stripeSecretKey } from "./stripe";

type RefundInput = { orderId: string; amount?: number };

export const refundOrder = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const userSnap = await db.collection("users").doc(uid).get();
  if (userSnap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  const { orderId, amount } = request.data as RefundInput;
  if (!orderId) throw new HttpsError("invalid-argument", "orderId is required.");

  let ref = db.collection("orders").doc(orderId);
  let snap = await ref.get();
  if (!snap.exists) {
    const byNumber = await db.collection("orders").where("number", "==", orderId).limit(1).get();
    if (byNumber.empty) throw new HttpsError("not-found", "Order not found.");
    ref = byNumber.docs[0].ref;
    snap = byNumber.docs[0];
  }

  const order = snap.data()!;
  if (!order.stripePaymentIntentId) {
    throw new HttpsError("failed-precondition", "Order has no payment to refund.");
  }

  const alreadyRefunded = order.refundedAmount ?? 0;
  const maxRefund = order.total - alreadyRefunded;
  const refundAmount = Math.min(amount ?? maxRefund, maxRefund);
  if (refundAmount <= 0) {
    throw new HttpsError("failed-precondition", "Nothing left to refund on this order.");
  }

  const stripe = getStripe();
  await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    amount: refundAmount,
  });

  const refundedAmount = alreadyRefunded + refundAmount;
  const paymentStatus = refundedAmount >= order.total ? "refunded" : "partially_refunded";
  const patch: Record<string, unknown> = {
    refundedAmount,
    paymentStatus,
    timeline: FieldValue.arrayUnion({
      id: `${orderId}-refund-${Date.now()}`,
      at: new Date().toISOString(),
      kind: "refund",
      label: `Refund of £${(refundAmount / 100).toFixed(2)} issued`,
    }),
  };
  if (paymentStatus === "refunded" && order.status !== "delivered") {
    patch.status = "cancelled";
  }
  await ref.update(patch);

  return { amount: refundAmount };
});
