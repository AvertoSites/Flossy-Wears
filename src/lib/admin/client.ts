"use client";

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

export const adminApi = {
  summary: () => fetch("/api/admin/summary").then(json<AdminSummary>),

  orders: (params: { status?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    return fetch(`/api/admin/orders?${qs}`).then(json<{ orders: Order[] }>);
  },
  order: (id: string) =>
    fetch(`/api/admin/orders/${id}`).then(json<{ order: Order }>),
  updateOrder: (id: string, body: Record<string, unknown>) =>
    fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ order: Order }>),
  refundOrder: (id: string, amount?: number) =>
    fetch(`/api/admin/orders/${id}/refund`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount }),
    }).then(json<{ order: Order; amount: number; mock: boolean }>),

  products: () =>
    fetch("/api/admin/products").then(json<{ products: Product[] }>),
  product: (id: string) =>
    fetch(`/api/admin/products/${id}`).then(json<{ product: Product }>),
  updateProduct: (id: string, body: Record<string, unknown>) =>
    fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ product: Product }>),

  inventory: () =>
    fetch("/api/admin/inventory").then(json<{ rows: LowStockRow[] }>),

  customers: () =>
    fetch("/api/admin/customers").then(json<{ customers: Customer[] }>),
  customer: (email: string) =>
    fetch(`/api/admin/customers/${encodeURIComponent(email)}`).then(
      json<{ customer: Customer; orders: Order[] }>,
    ),

  discounts: () =>
    fetch("/api/admin/discounts").then(json<{ discounts: Discount[] }>),
  createDiscount: (body: { code: string; percentOff: number; label?: string }) =>
    fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ discount: Discount }>),
  setDiscountActive: (code: string, active: boolean) =>
    fetch(`/api/admin/discounts/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active }),
    }).then(json<{ discount: Discount }>),
  deleteDiscount: (code: string) =>
    fetch(`/api/admin/discounts/${encodeURIComponent(code)}`, {
      method: "DELETE",
    }).then(json<{ ok: boolean }>),

  reviews: () =>
    fetch("/api/admin/reviews").then(json<{ reviews: AdminReview[] }>),
  setReviewPublished: (id: string, published: boolean) =>
    fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, published }),
    }).then(json<{ review: AdminReview }>),

  payments: () => fetch("/api/admin/payments").then(json<PaymentsOverview>),

  settings: () =>
    fetch("/api/admin/settings").then(json<{ settings: StoreSettings }>),
  updateSettings: (body: Partial<StoreSettings>) =>
    fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(json<{ settings: StoreSettings }>),
};
