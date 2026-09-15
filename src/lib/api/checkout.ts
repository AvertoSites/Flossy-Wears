import type { CartItem } from "@/types";

/**
 * Shared checkout types. Checkout itself is the `createCheckoutSession`
 * Firebase Cloud Function (see `functions/src/checkout.ts`) — this file no
 * longer talks to Stripe directly. `productId`/`variantId` are required so
 * the function can re-price every line from the real `products/{id}` doc
 * instead of trusting whatever the client sends.
 */
export type CheckoutLine = Pick<
  CartItem,
  "productId" | "variantId" | "name" | "price" | "quantity" | "image" | "customVerse"
>;

export type CreateCheckoutSessionInput = {
  lines: CheckoutLine[];
  shippingMethodId: string;
  addressId: string;
  discountCode?: string | null;
};

export type CreateCheckoutSessionResult = {
  url: string;
};
