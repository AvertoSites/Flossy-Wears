import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "./admin";
import { getStripe, siteUrl, stripeSecretKey } from "./stripe";
import { assertValidCustomVerse } from "./moderation";
import type {
  Address,
  CheckoutLineInput,
  OrderLine,
  Product,
  ShippingBand,
  StoreSettings,
} from "./types";

type CreateCheckoutSessionInput = {
  lines: CheckoutLineInput[];
  shippingMethodId: string;
  addressId: string;
  discountCode?: string | null;
  /** The caller's own origin (window.location.origin) — only trusted if it matches ALLOWED_ORIGINS, so Stripe's redirect can't be pointed anywhere arbitrary. */
  origin?: string;
};

// Stripe's success/cancel redirect target. Validated against this allowlist
// rather than trusted blindly from the client, which would otherwise let
// anyone redirect a Checkout Session wherever they like.
const ALLOWED_ORIGINS = [
  "https://flossywears.co.uk",
  "http://localhost:3000",
  "https://flossy-wears.netlify.app",
];

// Fallback for products created before `weightGrams` existed — a folded
// tee/sweatshirt in its mailer, roughly.
const DEFAULT_GARMENT_WEIGHT_GRAMS = 300;

/** First band (ascending) whose cap covers `grams`. Throws if the parcel is too heavy for this method — better than silently undercharging real postage. */
function priceForWeight(bands: ShippingBand[], grams: number): number {
  const sorted = [...bands].sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);
  const band = sorted.find((b) => grams <= b.maxWeightGrams);
  if (!band) {
    throw new HttpsError(
      "failed-precondition",
      "Your basket is too heavy for the selected delivery method — please contact us to arrange shipping.",
    );
  }
  return band.price;
}

/**
 * Re-prices every line from the real `products/{id}` doc — never trusts the
 * client's submitted price/name. Throws HttpsError on anything invalid
 * (unknown product/variant, inactive product, insufficient stock).
 */
async function repriceLines(lines: CheckoutLineInput[]): Promise<{
  orderLines: OrderLine[];
  subtotal: number;
  totalWeightGrams: number;
}> {
  if (!lines.length) throw new HttpsError("invalid-argument", "Basket is empty.");

  const orderLines: OrderLine[] = [];
  let subtotal = 0;
  let totalWeightGrams = 0;

  for (const line of lines) {
    if (!line.productId || !line.variantId || !line.quantity || line.quantity < 1) {
      throw new HttpsError("invalid-argument", "Invalid basket line.");
    }
    const snap = await db.collection("products").doc(line.productId).get();
    if (!snap.exists) throw new HttpsError("not-found", "A product in your basket no longer exists.");
    const product = snap.data() as Product;
    if (product.active === false) {
      throw new HttpsError("failed-precondition", `${product.name} is no longer available.`);
    }
    const variant = product.variants.find((v) => v.id === line.variantId);
    if (!variant) throw new HttpsError("not-found", "A basket item's variant no longer exists.");
    if (variant.stock < line.quantity) {
      throw new HttpsError(
        "failed-precondition",
        `Only ${variant.stock} left of ${product.name} (${variant.colour}/${variant.size}).`,
      );
    }
    if (line.customVerse && !product.customizable) {
      throw new HttpsError("invalid-argument", `${product.name} can't be customised.`);
    }
    assertValidCustomVerse(line.customVerse);

    const colourLabel =
      product.colours.find((c) => c.value === variant.colour)?.label ?? variant.colour;
    const price = variant.price.amount;
    subtotal += price * line.quantity;
    totalWeightGrams += (product.weightGrams ?? DEFAULT_GARMENT_WEIGHT_GRAMS) * line.quantity;
    orderLines.push({
      name: `${product.name} — ${colourLabel} / ${variant.size.toUpperCase()}`,
      colourLabel,
      size: variant.size.toUpperCase(),
      quantity: line.quantity,
      price,
      image: line.image,
      // Omit the key entirely rather than `customVerse: undefined` — the
      // Admin SDK rejects `undefined` nested inside array elements (this
      // array becomes orders/{id}.lines), even with ignoreUndefinedProperties.
      ...(line.customVerse && { customVerse: line.customVerse }),
      productId: product.id,
      variantId: variant.id,
    });
  }

  return { orderLines, subtotal, totalWeightGrams };
}

export const createCheckoutSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to check out.");
    if (request.auth?.token.email_verified !== true) {
      throw new HttpsError("failed-precondition", "Verify your email before checking out.");
    }

    const input = request.data as CreateCheckoutSessionInput;
    const [userSnap, addressSnap, settingsSnap] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("users").doc(uid).collection("addresses").doc(input.addressId ?? "").get(),
      db.collection("settings").doc("store").get(),
    ]);

    if (!userSnap.exists) throw new HttpsError("not-found", "User profile not found.");
    if (!addressSnap.exists) throw new HttpsError("not-found", "Delivery address not found.");
    if (!settingsSnap.exists) throw new HttpsError("internal", "Store is not configured yet.");

    const user = userSnap.data() as {
      firstName: string;
      lastName: string;
      email: string;
      stripeCustomerId?: string;
    };
    const address = { id: addressSnap.id, ...addressSnap.data() } as Address;
    const settings = settingsSnap.data() as StoreSettings;

    const { orderLines, subtotal, totalWeightGrams } = await repriceLines(input.lines);

    const method =
      settings.shippingMethods.find((m) => m.id === input.shippingMethodId) ??
      settings.shippingMethods[0];
    if (!method) throw new HttpsError("internal", "No shipping methods configured.");
    const shipping = priceForWeight(method.bands, totalWeightGrams);

    let discountPence = 0;
    let discountCode: string | null = null;
    let stripeCouponId: string | undefined;
    const stripe = getStripe();
    if (input.discountCode) {
      const code = input.discountCode.trim().toUpperCase();
      const discSnap = await db.collection("discounts").doc(code).get();
      if (discSnap.exists && discSnap.data()?.active === true) {
        const percentOff = discSnap.data()!.percentOff as number;
        discountCode = code;
        discountPence = Math.round((subtotal * percentOff) / 100);
        const coupon = await stripe.coupons.create({ percent_off: percentOff, duration: "once" });
        stripeCouponId = coupon.id;
      }
      // Silently ignore an invalid/inactive code rather than blocking checkout —
      // the cart page already validated it via /api/discounts/validate.
    }

    const total = Math.max(0, subtotal - discountPence) + shipping;

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: { uid },
      });
      stripeCustomerId = customer.id;
      await db.collection("users").doc(uid).update({ stripeCustomerId });
    }

    const origin =
      input.origin && ALLOWED_ORIGINS.includes(input.origin) ? input.origin : siteUrl.value();
    const lineItems: Array<{
      quantity: number;
      price_data: {
        currency: "gbp";
        unit_amount: number;
        product_data: { name: string; description?: string; metadata?: Record<string, string> };
      };
    }> = orderLines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: line.price,
        product_data: {
          name: line.name,
          ...(line.customVerse && {
            description: [
              `Custom verse: "${line.customVerse.text}" — ${line.customVerse.reference}`,
              line.customVerse.note && `Note: ${line.customVerse.note}`,
            ]
              .filter(Boolean)
              .join(" · "),
            metadata: {
              customVerseText: line.customVerse.text,
              customVerseReference: line.customVerse.reference,
              ...(line.customVerse.note && { customVerseNote: line.customVerse.note }),
            },
          }),
        },
      },
    }));
    if (shipping > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: shipping,
          product_data: { name: `Shipping — ${method.label}` },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      line_items: lineItems,
      ...(stripeCouponId && { discounts: [{ coupon: stripeCouponId }] }),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: { uid },
    });

    if (!session.url) throw new HttpsError("internal", "Stripe did not return a checkout URL.");

    await db
      .collection("orders")
      .doc(session.id)
      .set({
        id: session.id,
        number: "",
        status: "processing",
        placedAt: new Date().toISOString(),
        lines: orderLines,
        subtotal,
        shipping,
        discount: discountPence,
        discountCode,
        total,
        shippingAddress: address,
        shippingMethod: method.label,
        customerId: uid,
        customerEmail: user.email,
        customerName: `${user.firstName} ${user.lastName}`.trim(),
        paymentStatus: "pending",
        stripeCheckoutSessionId: session.id,
        timeline: [
          { id: `${session.id}-placed`, at: new Date().toISOString(), kind: "placed", label: "Order placed" },
        ],
        notes: [],
      });

    return { url: session.url };
  },
);
