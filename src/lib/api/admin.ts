import "server-only";

import { getStore, type StoredReview } from "@/lib/server/store";
import type {
  AdminSummary,
  Customer,
  Discount,
  LowStockRow,
  Order,
  OrderEvent,
  OrderStatus,
  PaymentsOverview,
  Product,
  StoreSettings,
} from "@/types";

function now() {
  return new Date().toISOString();
}

function addEvent(order: Order, event: Omit<OrderEvent, "id" | "at">) {
  order.timeline = [
    ...(order.timeline ?? []),
    { id: `evt_${Math.random().toString(36).slice(2, 9)}`, at: now(), ...event },
  ];
}

/* ---------------------------------- orders --------------------------------- */

export async function listOrders(params: {
  status?: string;
  q?: string;
} = {}): Promise<Order[]> {
  let orders = [...getStore().orders];
  if (params.status && params.status !== "all") {
    if (params.status === "unfulfilled") {
      orders = orders.filter(
        (o) => o.status === "processing" || o.status === "packed",
      );
    } else {
      orders = orders.filter((o) => o.status === params.status);
    }
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q),
    );
  }
  return orders;
}

export async function getOrderById(id: string): Promise<Order | null> {
  return (
    getStore().orders.find((o) => o.id === id || o.number === id) ?? null
  );
}

export async function updateFulfillment(
  id: string,
  input: {
    status?: OrderStatus;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    notifyCustomer?: boolean;
  },
): Promise<Order | null> {
  const order = getStore().orders.find((o) => o.id === id || o.number === id);
  if (!order) return null;

  const changes: string[] = [];

  if (input.carrier !== undefined) order.carrier = input.carrier || undefined;
  if (input.trackingNumber !== undefined)
    order.trackingNumber = input.trackingNumber || undefined;
  if (input.trackingUrl !== undefined)
    order.trackingUrl = input.trackingUrl || undefined;

  if (input.status && input.status !== order.status) {
    order.status = input.status;
    changes.push(`Status set to ${input.status}`);
    if (input.status === "shipped") order.shippedAt = now();
    if (input.status === "delivered") order.deliveredAt = now();
  }

  if (order.trackingNumber || order.carrier) {
    changes.push(
      `Tracking: ${order.carrier ?? "carrier"} ${order.trackingNumber ?? ""}`.trim(),
    );
  }

  addEvent(order, {
    kind: "fulfillment",
    label: changes[0] ?? "Fulfillment updated",
    detail: order.trackingNumber
      ? `${order.carrier ?? ""} ${order.trackingNumber}`.trim()
      : undefined,
  });

  if (input.notifyCustomer) {
    addEvent(order, {
      kind: "notification",
      label: `Tracking update emailed to ${order.customerEmail ?? "customer"}`,
    });
    // TODO(email): send via Resend once wired.
  }

  return order;
}

export async function addOrderNote(
  id: string,
  body: string,
  author = "Admin",
): Promise<Order | null> {
  const order = getStore().orders.find((o) => o.id === id || o.number === id);
  if (!order) return null;
  order.notes = [
    ...(order.notes ?? []),
    { id: `note_${Math.random().toString(36).slice(2, 9)}`, at: now(), author, body },
  ];
  addEvent(order, { kind: "note", label: "Internal note added", detail: body });
  return order;
}

export type RefundResult = {
  order: Order;
  amount: number;
  mock: boolean;
};

export async function refundOrder(
  id: string,
  amountPence?: number,
): Promise<RefundResult | null> {
  const order = getStore().orders.find((o) => o.id === id || o.number === id);
  if (!order) return null;

  const alreadyRefunded = order.refundedAmount ?? 0;
  const maxRefund = order.total - alreadyRefunded;
  const amount = Math.min(amountPence ?? maxRefund, maxRefund);
  if (amount <= 0) return { order, amount: 0, mock: true };

  let mock = true;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (secret && order.stripePaymentIntentId?.startsWith("pi_") && order.stripePaymentIntentId.length > 12) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secret);
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount,
      });
      mock = false;
    } catch {
      mock = true;
    }
  }

  order.refundedAmount = alreadyRefunded + amount;
  order.paymentStatus =
    order.refundedAmount >= order.total ? "refunded" : "partially_refunded";
  if (order.paymentStatus === "refunded" && order.status !== "delivered") {
    order.status = "cancelled";
  }
  addEvent(order, {
    kind: "refund",
    label: `${mock ? "Mock r" : "R"}efund of £${(amount / 100).toFixed(2)} issued`,
  });

  return { order, amount, mock };
}

/* --------------------------------- products -------------------------------- */

export async function listAdminProducts(): Promise<Product[]> {
  return [...getStore().products];
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  return (
    getStore().products.find((p) => p.id === id || p.slug === id) ?? null
  );
}

export async function updateAdminProduct(
  id: string,
  input: {
    price?: number;
    compareAtPrice?: number | null;
    badges?: Product["badges"];
    active?: boolean;
    variantStock?: Record<string, number>;
  },
): Promise<Product | null> {
  const product = getStore().products.find(
    (p) => p.id === id || p.slug === id,
  );
  if (!product) return null;

  if (typeof input.price === "number") {
    product.price = { amount: input.price, currency: "GBP" };
    product.variants.forEach((v) => {
      v.price = { amount: input.price!, currency: "GBP" };
    });
  }
  if (input.compareAtPrice === null) {
    product.compareAtPrice = undefined;
    product.variants.forEach((v) => (v.compareAtPrice = undefined));
  } else if (typeof input.compareAtPrice === "number") {
    product.compareAtPrice = { amount: input.compareAtPrice, currency: "GBP" };
    product.variants.forEach(
      (v) => (v.compareAtPrice = { amount: input.compareAtPrice!, currency: "GBP" }),
    );
  }
  if (input.badges) product.badges = input.badges;
  if (typeof input.active === "boolean") product.active = input.active;
  if (input.variantStock) {
    product.variants.forEach((v) => {
      if (v.id in input.variantStock!) {
        v.stock = Math.max(0, Math.round(input.variantStock![v.id]));
      }
    });
  }
  return product;
}

export async function listLowStock(
  threshold = 4,
): Promise<LowStockRow[]> {
  const rows: LowStockRow[] = [];
  for (const p of getStore().products) {
    for (const v of p.variants) {
      if (v.stock <= threshold) {
        rows.push({
          productId: p.id,
          slug: p.slug,
          name: p.name,
          variantId: v.id,
          colour: v.colour,
          size: v.size.toUpperCase(),
          stock: v.stock,
        });
      }
    }
  }
  return rows.sort((a, b) => a.stock - b.stock);
}

/* -------------------------------- customers -------------------------------- */

export async function listCustomers(): Promise<Customer[]> {
  const byEmail = new Map<string, Customer>();
  for (const order of getStore().orders) {
    const email = order.customerEmail ?? "unknown@example.com";
    const [firstName, ...rest] = (order.customerName ?? "Guest").split(" ");
    const existing =
      byEmail.get(email) ??
      ({
        id: `cust_${email.split("@")[0]}`,
        firstName,
        lastName: rest.join(" "),
        email,
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: order.placedAt,
      } satisfies Customer);
    existing.orderCount = (existing.orderCount ?? 0) + 1;
    existing.totalSpent =
      (existing.totalSpent ?? 0) + (order.total - (order.refundedAmount ?? 0));
    if (order.placedAt > (existing.lastOrderAt ?? "")) {
      existing.lastOrderAt = order.placedAt;
    }
    byEmail.set(email, existing);
  }
  return [...byEmail.values()].sort(
    (a, b) => (b.totalSpent ?? 0) - (a.totalSpent ?? 0),
  );
}

export async function getCustomerByEmail(email: string): Promise<{
  customer: Customer;
  orders: Order[];
} | null> {
  const customers = await listCustomers();
  const customer = customers.find((c) => c.email === email);
  if (!customer) return null;
  const orders = getStore().orders.filter((o) => o.customerEmail === email);
  return { customer, orders };
}

/* -------------------------------- discounts -------------------------------- */

export async function listDiscounts(): Promise<Discount[]> {
  return [...getStore().discounts];
}

export async function createDiscount(input: {
  code: string;
  percentOff: number;
  label?: string;
}): Promise<Discount | { error: string }> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { error: "Code is required" };
  if (getStore().discounts.some((d) => d.code === code)) {
    return { error: "That code already exists" };
  }
  const percentOff = Math.min(90, Math.max(1, Math.round(input.percentOff)));
  const discount: Discount = {
    code,
    label: input.label?.trim() || `${percentOff}% off`,
    percentOff,
    active: true,
    timesUsed: 0,
    createdAt: now(),
  };
  getStore().discounts.unshift(discount);
  return discount;
}

export async function setDiscountActive(
  code: string,
  active: boolean,
): Promise<Discount | null> {
  const discount = getStore().discounts.find((d) => d.code === code);
  if (!discount) return null;
  discount.active = active;
  return discount;
}

export async function deleteDiscount(code: string): Promise<boolean> {
  const store = getStore();
  const before = store.discounts.length;
  store.discounts = store.discounts.filter((d) => d.code !== code);
  return store.discounts.length < before;
}

/* --------------------------------- reviews -------------------------------- */

export async function listAdminReviews(): Promise<
  (StoredReview & { productName: string })[]
> {
  const { reviews, products } = getStore();
  return reviews
    .map((r) => ({
      ...r,
      productName:
        products.find((p) => p.id === r.productId)?.name ?? "Unknown product",
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setReviewPublished(
  id: string,
  published: boolean,
): Promise<StoredReview | null> {
  const review = getStore().reviews.find((r) => r.id === id);
  if (!review) return null;
  review.published = published;
  return review;
}

/* -------------------------------- settings ------------------------------- */

export async function getSettings(): Promise<StoreSettings> {
  return getStore().settings;
}

export async function updateSettings(
  input: Partial<StoreSettings>,
): Promise<StoreSettings> {
  const store = getStore();
  store.settings = { ...store.settings, ...input };
  return store.settings;
}

/* -------------------------------- dashboard ------------------------------ */

export async function getAdminSummary(): Promise<AdminSummary> {
  const { orders } = getStore();
  const paid = orders.filter((o) => o.paymentStatus !== "pending");

  const revenue = paid.reduce(
    (s, o) => s + (o.total - (o.refundedAmount ?? 0)),
    0,
  );
  const unitsSold = orders.reduce(
    (s, o) => s + o.lines.reduce((n, l) => n + l.quantity, 0),
    0,
  );
  const refundedAmount = orders.reduce(
    (s, o) => s + (o.refundedAmount ?? 0),
    0,
  );

  const days: { date: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const total = orders
      .filter((o) => o.placedAt.slice(0, 10) === key)
      .reduce((s, o) => s + o.total - (o.refundedAmount ?? 0), 0);
    days.push({ date: key, total });
  }

  const statuses: OrderStatus[] = [
    "processing",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  return {
    revenue,
    orderCount: orders.length,
    averageOrderValue: orders.length ? Math.round(revenue / orders.length) : 0,
    unitsSold,
    awaitingFulfillment: orders.filter(
      (o) => o.status === "processing" || o.status === "packed",
    ).length,
    lowStockCount: (await listLowStock()).length,
    refundedAmount,
    revenueByDay: days,
    statusBreakdown: statuses.map((status) => ({
      status,
      count: orders.filter((o) => o.status === status).length,
    })),
  };
}

/* ---------------------------------- stripe -------------------------------- */

export async function getPaymentsOverview(): Promise<PaymentsOverview> {
  const { orders } = getStore();
  const secret = process.env.STRIPE_SECRET_KEY;

  const payments = orders.map((o) => ({
    id: o.stripePaymentIntentId ?? o.number,
    orderNumber: o.number,
    customer: o.customerName ?? o.customerEmail ?? "Guest",
    amount: o.total,
    refunded: o.refundedAmount ?? 0,
    status:
      o.paymentStatus === "refunded"
        ? "refunded"
        : o.paymentStatus === "partially_refunded"
          ? "partially refunded"
          : "succeeded",
    createdAt: o.placedAt,
  }));

  if (secret) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secret);
      const balance = await stripe.balance.retrieve();
      return {
        live: true,
        balance: {
          available: balance.available[0]?.amount ?? 0,
          pending: balance.pending[0]?.amount ?? 0,
        },
        payments,
      };
    } catch {
      /* fall through to mock */
    }
  }

  const gross = payments.reduce((s, p) => s + p.amount - p.refunded, 0);
  return {
    live: false,
    balance: {
      available: Math.round(gross * 0.7),
      pending: Math.round(gross * 0.3),
    },
    payments,
  };
}
