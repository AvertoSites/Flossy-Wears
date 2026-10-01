import type { CollectionPoint, DeliveryType, ShippingMethod } from "./types";

/**
 * In-store collection point — mirrors `site.collection` in
 * `src/lib/data/site.ts` (separate TS project, can't import across the
 * `functions/` boundary). Snapshotted onto each collection order at checkout.
 */
export const COLLECTION_POINT: CollectionPoint = {
  address: "13 Skipsea Road, Sheffield S2 1BT",
  hours: "Mon–Sat, 10am–6pm",
  instructions:
    "Please bring your order confirmation email (on your phone is fine) as proof of purchase.",
};

/** `settings/store` docs seeded before `type` existed only mark collection by its id. */
export function isCollectionMethod(method: Pick<ShippingMethod, "id" | "type">): boolean {
  return method.type === "collection" || method.id === "collection";
}

/** Orders placed before `deliveryType` existed only carry the method label. */
export function isCollectionOrder(order: { deliveryType?: DeliveryType; shippingMethod?: string }): boolean {
  if (order.deliveryType) return order.deliveryType === "collection";
  return /collect/i.test(order.shippingMethod ?? "");
}
