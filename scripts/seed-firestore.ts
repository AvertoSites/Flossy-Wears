/**
 * One-time seed: pushes the real catalog/config fixtures into Firestore.
 *
 * Run manually, once, after deploying firestore.rules:
 *   npm run seed
 * (needs FIREBASE_SERVICE_ACCOUNT_KEY in .env.local — see .env.example)
 *
 * Deliberately does NOT seed reviews, orders, or any demo customer — those
 * were fake demo content, not real catalog/config data. Reviews start empty
 * and fill up from real customers; orders are only ever created by a real
 * checkout going forward.
 *
 * Safe to re-run: every write is a `set()` keyed by a stable id, so re-running
 * overwrites with the same fixture data rather than duplicating anything.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { products } from "../src/lib/data/products";
import { collections } from "../src/lib/data/collections";
import { site } from "../src/lib/data/site";
import { SHIPPING_METHODS } from "../src/lib/constants";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Add it to .env.local (see .env.example) before running the seed script.",
    );
  }
  return JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

const account = loadServiceAccount();
const app = initializeApp({
  credential: cert({
    projectId: account.project_id,
    clientEmail: account.client_email,
    privateKey: account.private_key,
  }),
});
const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

const REAL_DISCOUNTS = [
  { code: "FAITH10", label: "10% off your order", percentOff: 10 },
  { code: "WELCOME15", label: "15% off your first order", percentOff: 15 },
];

async function seedProducts() {
  const batch = db.batch();
  for (const p of products) {
    batch.set(db.collection("products").doc(p.id), { ...p, active: true });
  }
  await batch.commit();
  console.log(`Seeded ${products.length} products.`);
}

async function seedCollections() {
  const batch = db.batch();
  for (const c of collections) {
    batch.set(db.collection("collections").doc(c.id), c);
  }
  await batch.commit();
  console.log(`Seeded ${collections.length} collections.`);
}

async function seedSettings() {
  await db.collection("settings").doc("store").set({
    storeName: site.name,
    supportEmail: site.email,
    shippingMethods: SHIPPING_METHODS,
  });
  console.log("Seeded settings/store.");
}

async function seedDiscounts() {
  const batch = db.batch();
  for (const d of REAL_DISCOUNTS) {
    batch.set(db.collection("discounts").doc(d.code), {
      code: d.code,
      label: d.label,
      percentOff: d.percentOff,
      active: true,
      timesUsed: 0,
      createdAt: new Date().toISOString(),
    });
  }
  await batch.commit();
  console.log(`Seeded ${REAL_DISCOUNTS.length} discount codes.`);
}

async function seedCounters() {
  const ref = db.collection("counters").doc("orders");
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ next: 1001 });
    console.log("Initialised counters/orders at 1001.");
  } else {
    console.log("counters/orders already exists, leaving it untouched.");
  }
}

async function main() {
  await seedProducts();
  await seedCollections();
  await seedSettings();
  await seedDiscounts();
  await seedCounters();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
