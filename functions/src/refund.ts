import { FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./admin";
import { getStripe, stripeSecretKey } from "./stripe";
import { resendApiKey, sendRefundEmail } from "./email";
import { RESTOCKABLE_STATUSES, restockOrderInTransaction } from "./restock";
import type { OrderLine } from "./types";

type RefundInput = {
  orderId: string;
  amount?: number;
  /** Cancel the order too: refunds whatever is left (possibly nothing), restocks if it hasn't shipped, and sends one combined email. */
  cancel?: boolean;
};

export const refundOrder = onCall({ secrets: [stripeSecretKey, resendApiKey] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  const userSnap = await db.collection("users").doc(uid).get();
  if (userSnap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access required.");
  }

  const { orderId, amount, cancel = false } = request.data as RefundInput;
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
  if (cancel && order.status === "cancelled") {
    throw new HttpsError("failed-precondition", "This order is already cancelled.");
  }

  const alreadyRefunded = order.refundedAmount ?? 0;
  const maxRefund = order.stripePaymentIntentId ? order.total - alreadyRefunded : 0;
  const refundAmount = cancel ? maxRefund : Math.min(amount ?? maxRefund, maxRefund);
  if (!cancel) {
    if (!order.stripePaymentIntentId) {
      throw new HttpsError("failed-precondition", "Order has no payment to refund.");
    }
    if (refundAmount <= 0) {
      throw new HttpsError("failed-precondition", "Nothing left to refund on this order.");
    }
  }

  if (refundAmount > 0) {
    await getStripe().refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: refundAmount,
    });
  }

  const refundedAmount = alreadyRefunded + refundAmount;
  const fullyRefunded = refundedAmount >= order.total;
  // A full refund before delivery means the order isn't going ahead.
  const cancelled =
    cancel || (fullyRefunded && order.status !== "delivered" && order.status !== "cancelled");
  const restock =
    cancelled && RESTOCKABLE_STATUSES.includes(order.status) && !order.restockedAt;
  const now = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    // Reads (inside restock) must come before the order update below.
    if (restock) await restockOrderInTransaction(tx, ref, order.lines as OrderLine[]);
    const events: Record<string, string>[] = [];
    if (refundAmount > 0) {
      events.push({
        id: `${orderId}-refund-${Date.now()}`,
        at: now,
        kind: "refund",
        label: `Refund of £${(refundAmount / 100).toFixed(2)} issued`,
      });
    }
    if (cancelled && order.status !== "cancelled") {
      events.push({
        id: `${orderId}-cancel-${Date.now()}`,
        at: now,
        kind: "fulfillment",
        label: restock ? "Order cancelled · items returned to stock" : "Order cancelled",
      });
    }
    tx.update(ref, {
      ...(refundAmount > 0 && {
        refundedAmount,
        paymentStatus: fullyRefunded ? "refunded" : "partially_refunded",
      }),
      ...(cancelled && { status: "cancelled" }),
      ...(events.length && { timeline: FieldValue.arrayUnion(...events) }),
    });
  });

  if (order.customerEmail && (refundAmount > 0 || cancelled)) {
    const result = await sendRefundEmail({
      number: order.number,
      customerEmail: order.customerEmail,
      customerName: order.customerName ?? "",
      lines: order.lines as OrderLine[],
      refundAmount,
      totalRefunded: refundedAmount,
      orderTotal: order.total,
      cancelled,
    });
    await ref.update({
      timeline: FieldValue.arrayUnion({
        id: `${orderId}-refund-email-${Date.now()}`,
        at: new Date().toISOString(),
        kind: "notification",
        label: result.sent
          ? `${cancelled ? "Cancellation" : "Refund"} email sent to ${order.customerEmail}`
          : `${cancelled ? "Cancellation" : "Refund"} email NOT sent to ${order.customerEmail}`,
        ...(result.error && { detail: result.error }),
      }),
    });
  }

  return { amount: refundAmount, cancelled, restocked: restock };
});
