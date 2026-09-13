import "server-only";

import { demoAddresses, demoCustomer } from "@/lib/data/account";
import { getStore } from "@/lib/server/store";
import type { Address, Customer, Order } from "@/types";

/** The signed-in demo customer for the mock account area. */
const DEMO_EMAIL = "amara@example.com";

export async function getCustomer(): Promise<Customer> {
  return demoCustomer;
}

export async function getOrders(): Promise<Order[]> {
  return getStore()
    .orders.filter((o) => o.customerEmail === DEMO_EMAIL)
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

export async function getOrder(id: string): Promise<Order | null> {
  const order = getStore().orders.find(
    (o) => o.id === id || o.number === id,
  );
  if (!order || order.customerEmail !== DEMO_EMAIL) return null;
  return order;
}

export async function getAddresses(): Promise<Address[]> {
  return demoAddresses;
}
