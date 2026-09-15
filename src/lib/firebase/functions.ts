"use client";

import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "@/lib/firebase/client";
import type { CheckoutLine } from "@/lib/api/checkout";

const functions = getFunctions(firebaseApp);

export async function createCheckoutSession(input: {
  lines: CheckoutLine[];
  shippingMethodId: string;
  addressId: string;
  discountCode?: string | null;
}): Promise<{ url: string }> {
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

export async function refundOrder(orderId: string, amount?: number): Promise<{ amount: number }> {
  const call = httpsCallable<{ orderId: string; amount?: number }, { amount: number }>(
    functions,
    "refundOrder",
  );
  const { data } = await call({ orderId, amount });
  return data;
}
