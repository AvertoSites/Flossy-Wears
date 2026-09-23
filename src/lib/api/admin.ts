import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { revalidateTag } from "next/cache";
import Stripe from "stripe";
import { adminDb, adminStorage, stripUndefinedDeep } from "@/lib/firebase/admin";
import { sendTrackingUpdateEmail } from "@/lib/email/resend";
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
  Review,
  StoreSettings,
} from "@/types";

/**
 * Firestore-backed admin data layer — every `/api/admin/*` route calls
 * `requireAdmin(request)` (see `src/lib/server/require-admin.ts`) before any
 * of these run. Replaces the in-memory `getStore()` mock; same exported
 * signatures, so the admin UI pages barely changed.
 */

function now() {
  return new Date().toISOString();
}

function orderEvent(event: Omit<OrderEvent, "id" | "at">): OrderEvent {
  // Timeline events live inside an array field — Firestore's admin SDK
  // rejects `undefined` values nested inside array elements even with
  // `ignoreUndefinedProperties` set (that only covers plain object fields),
  // so strip any undefined keys (e.g. an event with no `detail`) here.
  const clean = Object.fromEntries(
    Object.entries(event).filter(([, v]) => v !== undefined),
  ) as Omit<OrderEvent, "id" | "at">;
  return { id: `evt_${Math.random().toString(36).slice(2, 9)}`, at: now(), ...clean };
}

async function findOrderRef(id: string) {
  const byId = adminDb.collection("orders").doc(id);
  const snap = await byId.get();
  if (snap.exists) return byId;
  const byNumber = await adminDb
    .collection("orders")
    .where("number", "==", id)
    .limit(1)
    .get();
  return byNumber.empty ? null : byNumber.docs[0].ref;
}

/* ---------------------------------- orders --------------------------------- */

export async function listOrders(params: {
  status?: string;
  q?: string;
} = {}): Promise<Order[]> {
  let query: FirebaseFirestore.Query = adminDb.collection("orders");
  if (params.status && params.status !== "all") {
    if (params.status === "unfulfilled") {
      query = query.where("status", "in", ["processing", "packed"]);
    } else {
      query = query.where("status", "==", params.status);
    }
  }
  const snap = await query.get();
  let orders = snap.docs.map((d) => d.data() as Order);

  if (params.q) {
    const q = params.q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q),
    );
  }
  return orders.sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const ref = await findOrderRef(id);
  if (!ref) return null;
  const snap = await ref.get();
  return (snap.data() as Order) ?? null;
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
  const ref = await findOrderRef(id);
  if (!ref) return null;

  let statusChanged = false;
  const updated = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const order = snap.data() as Order;
    const changes: string[] = [];
    const patch: Record<string, unknown> = {};

    if (input.carrier !== undefined) patch.carrier = input.carrier || FieldValue.delete();
    if (input.trackingNumber !== undefined)
      patch.trackingNumber = input.trackingNumber || FieldValue.delete();
    if (input.trackingUrl !== undefined)
      patch.trackingUrl = input.trackingUrl || FieldValue.delete();
    // `FieldValue.delete()` sentinels above are Firestore-write-only — spreading
    // `patch` into the in-memory `updated` order below would leak them as
    // truthy objects (e.g. `order.carrier` becoming `[object Object]` instead
    // of `undefined`) wherever that value is read without going back to
    // Firestore, notably the tracking-update email sent further down.
    const cleanCarrier = input.carrier !== undefined ? input.carrier || undefined : order.carrier;
    const cleanTrackingNumber =
      input.trackingNumber !== undefined ? input.trackingNumber || undefined : order.trackingNumber;
    const cleanTrackingUrl =
      input.trackingUrl !== undefined ? input.trackingUrl || undefined : order.trackingUrl;

    if (input.status && input.status !== order.status) {
      patch.status = input.status;
      changes.push(`Status set to ${input.status}`);
      if (input.status === "shipped") patch.shippedAt = now();
      if (input.status === "delivered") patch.deliveredAt = now();
      statusChanged = true;
    }

    if (cleanTrackingNumber || cleanCarrier) {
      changes.push(`Tracking: ${cleanCarrier ?? "carrier"} ${cleanTrackingNumber ?? ""}`.trim());
    }

    const timeline = [
      ...(order.timeline ?? []),
      orderEvent({
        kind: "fulfillment",
        label: changes[0] ?? "Fulfillment updated",
        detail: cleanTrackingNumber ? `${cleanCarrier ?? ""} ${cleanTrackingNumber}`.trim() : undefined,
      }),
    ];

    patch.timeline = timeline;
    tx.update(ref, patch);
    return {
      ...order,
      ...patch,
      carrier: cleanCarrier,
      trackingNumber: cleanTrackingNumber,
      trackingUrl: cleanTrackingUrl,
      timeline,
    } as Order;
  });

  // Shipped/delivered/cancelled are the transitions a customer needs to hear
  // about regardless of whether the admin remembered to tick "notify" —
  // everything else (processing, packed, a tracking-number-only edit) stays
  // opt-in via the checkbox.
  const ALWAYS_NOTIFY_STATUSES: OrderStatus[] = ["shipped", "delivered", "cancelled"];
  const shouldNotify =
    input.notifyCustomer || (statusChanged && ALWAYS_NOTIFY_STATUSES.includes(updated.status));

  if (shouldNotify) {
    await notifyCustomerOfUpdate(updated);
    return getOrderById(id);
  }
  return updated;
}

/** Separate from `updateFulfillment`'s transaction — email sends are a network call and shouldn't run inside a Firestore transaction (which can retry on contention and would resend). */
async function notifyCustomerOfUpdate(order: Order): Promise<void> {
  const ref = await findOrderRef(order.id);
  if (!ref || !order.customerEmail) return;

  const result = await sendTrackingUpdateEmail({
    to: order.customerEmail,
    orderNumber: order.number,
    status: order.status,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    lines: order.lines,
  });

  await ref.update({
    timeline: FieldValue.arrayUnion(
      orderEvent({
        kind: "notification",
        label: result.sent
          ? `Tracking update emailed to ${order.customerEmail}`
          : `Tracking update email NOT sent to ${order.customerEmail}`,
        detail: result.sent ? undefined : result.error,
      }),
    ),
  });
}

export async function addOrderNote(
  id: string,
  body: string,
  author = "Admin",
): Promise<Order | null> {
  const ref = await findOrderRef(id);
  if (!ref) return null;

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const order = snap.data() as Order;
    const notes = [
      ...(order.notes ?? []),
      { id: `note_${Math.random().toString(36).slice(2, 9)}`, at: now(), author, body },
    ];
    const timeline = [
      ...(order.timeline ?? []),
      orderEvent({ kind: "note", label: "Internal note added", detail: body }),
    ];
    tx.update(ref, { notes, timeline });
    return { ...order, notes, timeline } as Order;
  });
}

/* --------------------------------- products -------------------------------- */

export async function listAdminProducts(): Promise<Product[]> {
  const snap = await adminDb.collection("products").get();
  return snap.docs.map((d) => d.data() as Product);
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const byId = await adminDb.collection("products").doc(id).get();
  if (byId.exists) return byId.data() as Product;
  const bySlug = await adminDb
    .collection("products")
    .where("slug", "==", id)
    .limit(1)
    .get();
  return bySlug.empty ? null : (bySlug.docs[0].data() as Product);
}

/** `colour.value:size.value` — stable across edits even when a product's variant ids change (e.g. slug renamed). */
function variantKey(colour: string, size: string) {
  return `${colour}:${size}`;
}

function buildVariants(params: {
  slug: string;
  colours: Product["colours"];
  sizes: Product["sizes"];
  price: number;
  compareAtPrice?: number;
  stockByKey?: Record<string, number>;
  /** Per-colourway photo galleries from before this regenerate — the admin
   * form doesn't manage these directly, so preserve whatever a variant
   * already had rather than silently wiping it every time colours/sizes/price change. */
  imagesByKey?: Record<string, string[]>;
}): Product["variants"] {
  const variants: Product["variants"] = [];
  for (const colour of params.colours) {
    for (const size of params.sizes) {
      const key = variantKey(colour.value, size.value);
      variants.push({
        id: `${params.slug}-${colour.value}-${size.value}`,
        sku: `${params.slug}-${colour.value}-${size.value}`.toUpperCase(),
        colour: colour.value,
        size: size.value,
        price: { amount: params.price, currency: "GBP" },
        // Omit the key entirely when there's no compare-at price, rather
        // than setting it to `undefined` — Firestore's admin SDK rejects
        // `undefined` values nested inside array elements (`ignoreUndefinedProperties`
        // only covers plain object fields, not array items).
        ...(typeof params.compareAtPrice === "number" && {
          compareAtPrice: { amount: params.compareAtPrice, currency: "GBP" },
        }),
        stock: Math.max(0, Math.round(params.stockByKey?.[key] ?? 0)),
        images: params.imagesByKey?.[key] ?? [],
      });
    }
  }
  return variants;
}

export type ProductFormInput = {
  name: string;
  tagline: string;
  description: string;
  verse: { text: string; reference: string };
  type: Product["type"];
  category: Product["category"];
  collectionSlugs: string[];
  price: number;
  compareAtPrice?: number | null;
  colours: Product["colours"];
  sizes: Product["sizes"];
  images: string[];
  badges: Product["badges"];
  fabric: string;
  care: string[];
  fit: string;
  weightGrams: number;
  active: boolean;
  customizable: boolean;
  /** Keyed by `colour.value:size.value` — see `variantKey`. */
  stockByKey: Record<string, number>;
};

/** `id` is pre-generated client-side (so Storage image uploads have somewhere to live before the product doc exists) and used as the Firestore doc id. */
export async function createAdminProduct(
  id: string,
  slug: string,
  input: ProductFormInput,
): Promise<Product | { error: string }> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return { error: "Slug is required" };
  const existing = await adminDb
    .collection("products")
    .where("slug", "==", cleanSlug)
    .limit(1)
    .get();
  if (!existing.empty) return { error: "That slug is already in use" };
  if (input.colours.length === 0 || input.sizes.length === 0) {
    return { error: "Pick at least one colour and one size" };
  }

  const product: Product = {
    id,
    slug: cleanSlug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    verse: input.verse,
    type: input.type,
    category: input.category,
    collectionSlugs: input.collectionSlugs,
    price: { amount: input.price, currency: "GBP" },
    compareAtPrice:
      typeof input.compareAtPrice === "number"
        ? { amount: input.compareAtPrice, currency: "GBP" }
        : undefined,
    colours: input.colours,
    sizes: input.sizes,
    variants: buildVariants({
      slug: cleanSlug,
      colours: input.colours,
      sizes: input.sizes,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? undefined,
      stockByKey: input.stockByKey,
    }),
    images: input.images,
    badges: input.badges,
    rating: 0,
    reviewCount: 0,
    fabric: input.fabric,
    care: input.care,
    fit: input.fit,
    weightGrams: input.weightGrams,
    active: input.active,
    customizable: input.customizable,
    createdAt: now(),
  };

  await adminDb.collection("products").doc(id).set(stripUndefinedDeep(product));
  revalidateTag("products", { expire: 0 });
  return product;
}

export async function updateAdminProduct(
  id: string,
  input: Partial<ProductFormInput> & { slug?: string; variantStock?: Record<string, number> },
): Promise<Product | { error: string } | null> {
  const product = await getAdminProduct(id);
  if (!product) return null;
  const ref = adminDb.collection("products").doc(product.id);

  if (input.slug && input.slug.trim().toLowerCase() !== product.slug) {
    const cleanSlug = input.slug.trim().toLowerCase();
    const existing = await adminDb
      .collection("products")
      .where("slug", "==", cleanSlug)
      .limit(1)
      .get();
    if (!existing.empty) return { error: "That slug is already in use" };
    product.slug = cleanSlug;
  }

  if (input.name !== undefined) product.name = input.name;
  if (input.tagline !== undefined) product.tagline = input.tagline;
  if (input.description !== undefined) product.description = input.description;
  if (input.verse !== undefined) product.verse = input.verse;
  if (input.type !== undefined) product.type = input.type;
  if (input.category !== undefined) product.category = input.category;
  if (input.collectionSlugs !== undefined) product.collectionSlugs = input.collectionSlugs;
  if (input.images !== undefined) product.images = input.images;
  if (input.badges !== undefined) product.badges = input.badges;
  if (input.fabric !== undefined) product.fabric = input.fabric;
  if (input.care !== undefined) product.care = input.care;
  if (input.fit !== undefined) product.fit = input.fit;
  if (typeof input.weightGrams === "number") product.weightGrams = input.weightGrams;
  if (typeof input.active === "boolean") product.active = input.active;
  if (typeof input.customizable === "boolean") product.customizable = input.customizable;
  if (input.colours !== undefined) product.colours = input.colours;
  if (input.sizes !== undefined) product.sizes = input.sizes;

  const priceChanged = typeof input.price === "number";
  if (priceChanged) product.price = { amount: input.price!, currency: "GBP" };
  if (input.compareAtPrice === null) {
    product.compareAtPrice = undefined;
  } else if (typeof input.compareAtPrice === "number") {
    product.compareAtPrice = { amount: input.compareAtPrice, currency: "GBP" };
  }

  // Colours/sizes/price changing means variants must be regenerated; a plain
  // stock tweak (from the old narrow editor) just patches stock in place.
  if (input.colours || input.sizes || priceChanged) {
    const stockByKey =
      input.stockByKey ??
      Object.fromEntries(
        product.variants.map((v) => [variantKey(v.colour, v.size), v.stock]),
      );
    const imagesByKey = Object.fromEntries(
      product.variants
        .filter((v) => v.images.length > 0)
        .map((v) => [variantKey(v.colour, v.size), v.images]),
    );
    product.variants = buildVariants({
      slug: product.slug,
      colours: product.colours,
      sizes: product.sizes,
      price: product.price.amount,
      compareAtPrice: product.compareAtPrice?.amount,
      stockByKey,
      imagesByKey,
    });
  } else if (input.compareAtPrice !== undefined) {
    product.variants = product.variants.map((v) => {
      const rest = { ...v };
      delete rest.compareAtPrice;
      return product.compareAtPrice ? { ...rest, compareAtPrice: product.compareAtPrice } : rest;
    });
  }
  if (input.variantStock) {
    product.variants = product.variants.map((v) =>
      v.id in input.variantStock!
        ? { ...v, stock: Math.max(0, Math.round(input.variantStock![v.id])) }
        : v,
    );
  }

  await ref.set(stripUndefinedDeep(product));
  revalidateTag("products", { expire: 0 });
  return product;
}

/** Deletes a product doc and its uploaded photos — works the same whether the product came from the seed script or the admin "New product" form. */
export async function deleteAdminProduct(id: string): Promise<boolean> {
  const product = await getAdminProduct(id);
  if (!product) return false;

  await adminDb.collection("products").doc(product.id).delete();

  try {
    await adminStorage.bucket().deleteFiles({ prefix: `product-images/${product.id}/` });
  } catch {
    // Best-effort cleanup — a stuck Storage file shouldn't block the product
    // being gone from the catalog.
  }

  revalidateTag("products", { expire: 0 });
  return true;
}

export async function listLowStock(threshold = 4): Promise<LowStockRow[]> {
  const products = await listAdminProducts();
  const rows: LowStockRow[] = [];
  for (const p of products) {
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
  const snap = await adminDb.collection("orders").get();
  const byEmail = new Map<string, Customer>();
  for (const doc of snap.docs) {
    const order = doc.data() as Order;
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
  const snap = await adminDb
    .collection("orders")
    .where("customerEmail", "==", email)
    .get();
  const orders = snap.docs.map((d) => d.data() as Order);
  return { customer, orders };
}

/* -------------------------------- discounts -------------------------------- */

export async function listDiscounts(): Promise<Discount[]> {
  const snap = await adminDb.collection("discounts").get();
  return snap.docs.map((d) => d.data() as Discount);
}

export async function createDiscount(input: {
  code: string;
  percentOff: number;
  label?: string;
}): Promise<Discount | { error: string }> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { error: "Code is required" };
  const ref = adminDb.collection("discounts").doc(code);
  if ((await ref.get()).exists) {
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
  await ref.set(discount);
  return discount;
}

export async function setDiscountActive(
  code: string,
  active: boolean,
): Promise<Discount | null> {
  const ref = adminDb.collection("discounts").doc(code.toUpperCase());
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ active });
  return { ...(snap.data() as Discount), active };
}

export async function deleteDiscount(code: string): Promise<boolean> {
  const ref = adminDb.collection("discounts").doc(code.toUpperCase());
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

/* --------------------------------- reviews -------------------------------- */

export async function listAdminReviews(): Promise<
  (Review & { published: boolean; productName: string })[]
> {
  const [reviewsSnap, productsSnap] = await Promise.all([
    adminDb.collection("reviews").get(),
    adminDb.collection("products").get(),
  ]);
  const productNames = new Map(
    productsSnap.docs.map((d) => [d.id, (d.data() as Product).name]),
  );
  return reviewsSnap.docs
    .map((d) => {
      const r = d.data() as Review & { published: boolean };
      return { ...r, productName: productNames.get(r.productId) ?? "Unknown product" };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function setReviewPublished(
  id: string,
  published: boolean,
): Promise<(Review & { published: boolean }) | null> {
  const ref = adminDb.collection("reviews").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update({ published });
  return { ...(snap.data() as Review & { published: boolean }), published };
}

/* -------------------------------- settings ------------------------------- */

export async function getSettings(): Promise<StoreSettings> {
  const snap = await adminDb.collection("settings").doc("store").get();
  return snap.data() as StoreSettings;
}

export async function updateSettings(
  input: Partial<StoreSettings>,
): Promise<StoreSettings> {
  const ref = adminDb.collection("settings").doc("store");
  await ref.set(input, { merge: true });
  revalidateTag("settings", { expire: 0 });
  return (await ref.get()).data() as StoreSettings;
}

/* -------------------------------- dashboard ------------------------------ */

export async function getAdminSummary(): Promise<AdminSummary> {
  const snap = await adminDb.collection("orders").get();
  const orders = snap.docs.map((d) => d.data() as Order);
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
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  const snap = await adminDb.collection("orders").get();
  const orders = snap.docs.map((d) => d.data() as Order);
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
}
