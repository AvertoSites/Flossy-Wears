"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebase/client";
import type { CreateCheckoutSessionInput } from "@/lib/api/checkout";

const functions = getFunctions(firebaseApp);

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<{ url: string }> {
  const call = httpsCallable<typeof input & { origin?: string }, { url: string }>(
    functions,
    "createCheckoutSession",
  );
  const { data } = await call({
    ...input,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
  });
  return data;
}

export async function confirmCheckoutSession(sessionId: string): Promise<{ ok: boolean }> {
  const call = httpsCallable<{ sessionId: string }, { ok: boolean }>(
    functions,
    "confirmCheckoutSession",
  );
  const { data } = await call({ sessionId });
  return data;
}

type RefundResult = { amount: number; cancelled: boolean; restocked: boolean };

/**
 * Refunds via Stripe and emails the customer. With `cancel: true` it also
 * cancels the order — refunding whatever is left and returning items to
 * stock if they haven't shipped. A full refund before delivery cancels too.
 */
export async function refundOrder(
  orderId: string,
  opts: { amount?: number; cancel?: boolean } = {},
): Promise<RefundResult> {
  const call = httpsCallable<
    { orderId: string; amount?: number; cancel?: boolean },
    RefundResult
  >(functions, "refundOrder");
  const { data } = await call({ orderId, ...opts });
  return data;
}
