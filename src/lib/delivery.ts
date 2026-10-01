import { site } from "@/lib/data/site";
import type { CollectionPoint, Order, OrderStatus, ShippingMethod } from "@/types";

/** `settings/store` docs seeded before `type` existed only mark collection by its id. */
export function isCollectionMethod(method: Pick<ShippingMethod, "id" | "type"> | undefined): boolean {
  return !!method && (method.type === "collection" || method.id === "collection");
}

/** Orders placed before `deliveryType` existed only carry the method label. */
export function isCollectionOrder(order: Pick<Order, "deliveryType" | "shippingMethod">): boolean {
  if (order.deliveryType) return order.deliveryType === "collection";
  return /collect/i.test(order.shippingMethod ?? "");
}

export function collectionPointFor(order: Pick<Order, "collectionPoint">): CollectionPoint {
  return order.collectionPoint ?? site.collection;
}

const COLLECTION_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  packed: "Ready for collection",
  delivered: "Collected",
};

/** Human label for an order status — collection orders are never "shipped" or "delivered". */
export function orderStatusLabel(status: OrderStatus, collection = false): string {
  if (collection && COLLECTION_STATUS_LABELS[status]) return COLLECTION_STATUS_LABELS[status]!;
  return status.charAt(0).toUpperCase() + status.slice(1);
}
