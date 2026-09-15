"use client";

import { firebaseAuth } from "@/lib/firebase/client";
import type {
  AdminReview,
  AdminSummary,
  Customer,
  Discount,
  LowStockRow,
  Order,
  PaymentsOverview,
  Product,
  StoreSettings,
} from "@/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

/**
 * Every `/api/admin/*` route now verifies this bearer token server-side (see
 * `src/lib/server/require-admin.ts`) — the routes are the real security
 * boundary, `AdminGate` is just UI routing.
 */
async function authHeaders(): Promise<HeadersInit> {
  const idToken = await firebaseAuth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");
  return { authorization: `Bearer ${idToken}`, "content-type": "application/json" };
}

async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = await authHeaders();
  return fetch(url, { ...init, headers: { ...headers, ...init.headers } });
}

export const adminApi = {
  summary: () => authedFetch("/api/admin/summary").then(json<AdminSummary>),

  orders: (params: { status?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    return authedFetch(`/api/admin/orders?${qs}`).then(json<{ orders: Order[] }>);
  },
  order: (id: string) =>
    authedFetch(`/api/admin/orders/${id}`).then(json<{ order: Order }>),
  updateOrder: (id: string, body: Record<string, unknown>) =>
    authedFetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then(json<{ order: Order }>),

  products: () => authedFetch("/api/admin/products").then(json<{ products: Product[] }>),
  product: (id: string) =>
    authedFetch(`/api/admin/products/${id}`).then(json<{ product: Product }>),
  createProduct: (body: Record<string, unknown>) =>
    authedFetch("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(body),
    }).then(json<{ product: Product }>),
  updateProduct: (id: string, body: Record<string, unknown>) =>
    authedFetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then(json<{ product: Product }>),
  deleteProduct: (id: string) =>
    authedFetch(`/api/admin/products/${id}`, { method: "DELETE" }).then(json<{ ok: boolean }>),

  inventory: () => authedFetch("/api/admin/inventory").then(json<{ rows: LowStockRow[] }>),

  customers: () => authedFetch("/api/admin/customers").then(json<{ customers: Customer[] }>),
  customer: (email: string) =>
    authedFetch(`/api/admin/customers/${encodeURIComponent(email)}`).then(
      json<{ customer: Customer; orders: Order[] }>,
    ),

  discounts: () => authedFetch("/api/admin/discounts").then(json<{ discounts: Discount[] }>),
  createDiscount: (body: { code: string; percentOff: number; label?: string }) =>
    authedFetch("/api/admin/discounts", {
      method: "POST",
      body: JSON.stringify(body),
    }).then(json<{ discount: Discount }>),
  setDiscountActive: (code: string, active: boolean) =>
    authedFetch(`/api/admin/discounts/${encodeURIComponent(code)}`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }).then(json<{ discount: Discount }>),
  deleteDiscount: (code: string) =>
    authedFetch(`/api/admin/discounts/${encodeURIComponent(code)}`, {
      method: "DELETE",
    }).then(json<{ ok: boolean }>),

  reviews: () => authedFetch("/api/admin/reviews").then(json<{ reviews: AdminReview[] }>),
  setReviewPublished: (id: string, published: boolean) =>
    authedFetch("/api/admin/reviews", {
      method: "PATCH",
      body: JSON.stringify({ id, published }),
    }).then(json<{ review: AdminReview }>),

  payments: () => authedFetch("/api/admin/payments").then(json<PaymentsOverview>),

  settings: () => authedFetch("/api/admin/settings").then(json<{ settings: StoreSettings }>),
  updateSettings: (body: Partial<StoreSettings>) =>
    authedFetch("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }).then(json<{ settings: StoreSettings }>),

  refreshTracking: (id: string) =>
    authedFetch(`/api/admin/orders/${id}/tracking`, { method: "POST" }).then(
      json<{ order: Order }>,
    ),
};
