import type { DocumentReference, Transaction } from "firebase-admin/firestore";
import { db } from "./admin";
import type { OrderLine, Product } from "./types";

/**
 * Statuses where the items are still with us — cancelling/refunding these puts
 * stock back. Once shipped/delivered/collected, stock comes back only if the
 * admin restocks a returned item by hand.
 */
export const RESTOCKABLE_STATUSES = ["processing", "packed"];

/**
 * Adds an order's quantities back onto its variants and stamps `restockedAt`
 * so a second cancel/refund can't restock twice. Mirrors the decrement in
 * fulfillment.ts. All reads happen before writes (Firestore transaction rule).
 */
export async function restockOrderInTransaction(
  tx: Transaction,
  orderRef: DocumentReference,
  lines: OrderLine[],
): Promise<void> {
  const productIds = [...new Set(lines.map((l) => l.productId).filter(Boolean))];
  const productSnaps = await Promise.all(
    productIds.map((id) => tx.get(db.collection("products").doc(id))),
  );
  for (const snap of productSnaps) {
    if (!snap.exists) continue;
    const product = snap.data() as Product;
    let changed = false;
    const variants = product.variants.map((v) => {
      const qty = lines
        .filter((l) => l.productId === product.id && l.variantId === v.id)
        .reduce((n, l) => n + l.quantity, 0);
      if (!qty) return v;
      changed = true;
      return { ...v, stock: v.stock + qty };
    });
    if (changed) tx.update(snap.ref, { variants });
  }
  tx.update(orderRef, { restockedAt: new Date().toISOString() });
}
