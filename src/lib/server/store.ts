import "server-only";

import { products as productFixtures } from "@/lib/data/products";
import { reviews as reviewFixtures } from "@/lib/data/reviews";
import { PROMO_CODES } from "@/lib/api/checkout";
import { SHIPPING_METHODS } from "@/lib/constants";
import { site } from "@/lib/data/site";
import type {
  Discount,
  Order,
  OrderEvent,
  OrderStatus,
  PaymentStatus,
  Product,
  Review,
  StoreSettings,
} from "@/types";

/**
 * In-memory admin store. Seeds from the storefront fixtures and is mutated by
 * the `/api/admin/*` route handlers. Persists for the life of the server
 * process (kept on `globalThis` so it survives dev HMR). Replace with Firestore
 * later — the shapes here are the contract.
 */

export type StoredReview = Review & { published: boolean };

type Store = {
  products: Product[];
  orders: Order[];
  reviews: StoredReview[];
  discounts: Discount[];
  settings: StoreSettings;
};

const CUSTOMERS = [
  { firstName: "Amara", lastName: "Okafor", email: "amara@example.com" },
  { firstName: "James", lastName: "Whitfield", email: "james.w@example.com" },
  { firstName: "Priya", lastName: "Nair", email: "priya.nair@example.com" },
  { firstName: "Tolu", lastName: "Adeyemi", email: "tolu.a@example.com" },
  { firstName: "Hannah", lastName: "Berg", email: "hannah.berg@example.com" },
  { firstName: "Marcus", lastName: "Lund", email: "m.lund@example.com" },
  { firstName: "Grace", lastName: "Abara", email: "grace.abara@example.com" },
  { firstName: "Daniel", lastName: "Osei", email: "d.osei@example.com" },
];

const CARRIERS = ["Royal Mail", "DPD", "Evri", "UPS"];
const STATUS_FLOW: OrderStatus[] = [
  "processing",
  "packed",
  "shipped",
  "delivered",
];

function iso(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(9 + (daysAgo % 8), (daysAgo * 7) % 60, 0, 0);
  return d.toISOString();
}

function seedOrders(products: Product[]): Order[] {
  const orders: Order[] = [];
  const count = 26;

  for (let i = 0; i < count; i++) {
    const customer = CUSTOMERS[i % CUSTOMERS.length];
    const daysAgo = Math.floor((i * 1.7) % 40);
    const lineCount = 1 + (i % 3);
    const lines = Array.from({ length: lineCount }).map((_, li) => {
      const product = products[(i * 3 + li) % products.length];
      const variant = product.variants[(i + li) % product.variants.length];
      const qty = 1 + ((i + li) % 2);
      return {
        name: product.name,
        colourLabel:
          product.colours.find((c) => c.value === variant.colour)?.label ??
          variant.colour,
        size: variant.size.toUpperCase(),
        quantity: qty,
        price: variant.price.amount,
        image: product.images[0],
      };
    });

    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    const freeShip = subtotal >= site.freeShippingThreshold;
    const shipping = freeShip ? 0 : 395;
    const discount = i % 5 === 0 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount + shipping;

    // Older orders are further along the fulfillment flow.
    const stage =
      daysAgo > 20 ? 3 : daysAgo > 10 ? 2 : daysAgo > 4 ? 1 : Math.min(i % 4, 1);
    let status: OrderStatus = STATUS_FLOW[stage];
    let paymentStatus: PaymentStatus = "paid";
    if (i % 13 === 7) {
      status = "cancelled";
      paymentStatus = "refunded";
    }

    const shipped = stage >= 2;
    const carrier = CARRIERS[i % CARRIERS.length];
    const trackingNumber = shipped
      ? `${carrier.slice(0, 2).toUpperCase()}${(987654321 + i * 111).toString()}GB`
      : undefined;

    const number = `FW-${1200 + i}`;
    const placedAt = iso(daysAgo);

    const timeline: OrderEvent[] = [
      {
        id: `${number}-e1`,
        at: placedAt,
        kind: "placed",
        label: "Order placed",
      },
      {
        id: `${number}-e2`,
        at: placedAt,
        kind: "payment",
        label: `Payment ${paymentStatus === "refunded" ? "captured" : "succeeded"}`,
        detail: `£${(total / 100).toFixed(2)} · Visa ···${4242 - (i % 100)}`,
      },
    ];
    if (stage >= 1)
      timeline.push({
        id: `${number}-e3`,
        at: iso(Math.max(0, daysAgo - 1)),
        kind: "fulfillment",
        label: "Packed",
      });
    if (shipped)
      timeline.push({
        id: `${number}-e4`,
        at: iso(Math.max(0, daysAgo - 2)),
        kind: "fulfillment",
        label: `Shipped with ${carrier}`,
        detail: trackingNumber,
      });
    if (stage >= 3)
      timeline.push({
        id: `${number}-e5`,
        at: iso(Math.max(0, daysAgo - 4)),
        kind: "fulfillment",
        label: "Delivered",
      });
    if (paymentStatus === "refunded")
      timeline.push({
        id: `${number}-e6`,
        at: iso(Math.max(0, daysAgo - 1)),
        kind: "refund",
        label: "Refunded in full",
        detail: `£${(total / 100).toFixed(2)}`,
      });

    orders.push({
      id: `ord_${number}`,
      number,
      status,
      placedAt,
      lines,
      subtotal,
      shipping,
      discount,
      total,
      shippingAddress: {
        id: `addr_${number}`,
        firstName: customer.firstName,
        lastName: customer.lastName,
        line1: `${10 + i} ${["Rye Lane", "Bellenden Road", "Choumert Road", "Nunhead Lane"][i % 4]}`,
        city: ["London", "Manchester", "Bristol", "Leeds"][i % 4],
        postcode: ["SE15 4ST", "M1 2WD", "BS1 5TR", "LS1 4DY"][i % 4],
        country: "United Kingdom",
        phone: "07700 900" + (100 + i),
      },
      shippingMethod: freeShip ? "Standard delivery" : "Standard delivery",
      customerEmail: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      paymentStatus,
      stripePaymentIntentId: `pi_3Q${(1000000 + i * 7919).toString(36)}`,
      refundedAmount: paymentStatus === "refunded" ? total : 0,
      carrier: shipped ? carrier : undefined,
      trackingNumber,
      trackingUrl: shipped
        ? "https://www.royalmail.com/track-your-item"
        : undefined,
      shippedAt: shipped ? iso(Math.max(0, daysAgo - 2)) : undefined,
      deliveredAt: stage >= 3 ? iso(Math.max(0, daysAgo - 4)) : undefined,
      timeline,
      notes: [],
    });
  }

  return orders.sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

function createStore(): Store {
  const products: Product[] = productFixtures.map((p) => ({
    ...p,
    active: true,
    variants: p.variants.map((v) => ({ ...v })),
    colours: p.colours.map((c) => ({ ...c })),
  }));

  const discounts: Discount[] = Object.entries(PROMO_CODES).map(
    ([code, value], i) => ({
      code,
      label: value.label,
      percentOff: value.percentOff,
      active: true,
      timesUsed: [42, 17][i] ?? 0,
      createdAt: iso(60 - i * 10),
    }),
  );

  const reviews: StoredReview[] = reviewFixtures.map((r, i) => ({
    ...r,
    published: i % 9 !== 4,
  }));

  const settings: StoreSettings = {
    storeName: site.name,
    supportEmail: site.email,
    freeShippingThreshold: site.freeShippingThreshold,
    shippingMethods: SHIPPING_METHODS.map((m) => ({ ...m })),
  };

  return { products, orders: seedOrders(products), reviews, discounts, settings };
}

const globalKey = "__flossywears_admin_store__";
type GlobalWithStore = typeof globalThis & { [globalKey]?: Store };

export function getStore(): Store {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) g[globalKey] = createStore();
  return g[globalKey]!;
}
