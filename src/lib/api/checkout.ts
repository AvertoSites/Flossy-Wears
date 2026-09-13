import { SHIPPING_METHODS } from "@/lib/constants";
import type { CartItem } from "@/types";

export type CheckoutLine = Pick<CartItem, "name" | "price" | "quantity" | "image">;

export type CreateCheckoutInput = {
  lines: CheckoutLine[];
  shippingMethodId: string;
  discountPence?: number;
  email: string;
};

export type CreateCheckoutResult = {
  /** URL to redirect the shopper to (Stripe Checkout, or the mock success page). */
  url: string;
  mock: boolean;
};

/**
 * Payment provider seam. The Stripe implementation lives in the
 * `/api/checkout` route handler; Firebase/Cloud Functions can implement the
 * same contract later without touching the checkout UI.
 */
export interface PaymentProvider {
  createCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
}

export function calculateTotals(input: {
  subtotalPence: number;
  shippingMethodId: string;
  discountPence?: number;
}) {
  const method =
    SHIPPING_METHODS.find((m) => m.id === input.shippingMethodId) ?? SHIPPING_METHODS[0];
  const discount = input.discountPence ?? 0;
  const shipping = method.price;
  const total = Math.max(0, input.subtotalPence - discount) + shipping;
  return { shipping, discount, total, method };
}

/** Very small promo table for the mock checkout. */
export const PROMO_CODES: Record<string, { label: string; percentOff: number }> = {
  FAITH10: { label: "10% off your order", percentOff: 10 },
  WELCOME15: { label: "15% off your first order", percentOff: 15 },
};

export function applyPromo(code: string, subtotalPence: number) {
  const promo = PROMO_CODES[code.trim().toUpperCase()];
  if (!promo) return null;
  return {
    code: code.trim().toUpperCase(),
    label: promo.label,
    discountPence: Math.round((subtotalPence * promo.percentOff) / 100),
  };
}
