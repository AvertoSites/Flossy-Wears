"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import type { Order } from "@/types";

async function fetchCustomerOrders(uid: string): Promise<Order[]> {
  const q = query(
    collection(firestore, "orders"),
    where("customerId", "==", uid),
    orderBy("placedAt", "desc"),
  );
  const snap = await getDocs(q);
  // Pending = checkout started but payment never completed (abandoned) —
  // not a real order yet, so hide it from order history.
  return snap.docs
    .map((d) => d.data() as Order)
    .filter((o) => o.paymentStatus !== "pending");
}

/** A signed-in customer's own paid/fulfilled orders, newest first. Requires the composite index in firestore.indexes.json. */
export function useCustomerOrders(uid: string | undefined) {
  return useQuery({
    queryKey: ["orders", "customer", uid],
    queryFn: () => fetchCustomerOrders(uid!),
    enabled: !!uid,
  });
}

/** Accepts the order doc id (links inside the account) or its number, e.g. "FW-1009" (links in emails). */
async function fetchCustomerOrder(uid: string, orderId: string): Promise<Order | null> {
  const id = decodeURIComponent(orderId);
  if (/^FW-\d+$/i.test(id)) {
    // Must filter on customerId — Firestore rules only allow querying your own orders.
    const byNumber = await getDocs(
      query(
        collection(firestore, "orders"),
        where("customerId", "==", uid),
        where("number", "==", id.toUpperCase()),
        limit(1),
      ),
    );
    return byNumber.empty ? null : (byNumber.docs[0].data() as Order);
  }
  const snap = await getDoc(doc(firestore, "orders", id));
  if (!snap.exists()) return null;
  const order = snap.data() as Order & { customerId?: string };
  if (order.customerId !== uid) return null; // belongs to someone else — Firestore rules would refuse this read anyway.
  return order;
}

export function useCustomerOrder(uid: string | undefined, orderId: string) {
  return useQuery({
    queryKey: ["orders", "customer", uid, orderId],
    queryFn: () => fetchCustomerOrder(uid!, orderId),
    enabled: !!uid && !!orderId,
  });
}
