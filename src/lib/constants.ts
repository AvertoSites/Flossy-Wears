import type { ColourOption, ProductSort, ShippingMethod, SizeOption } from "@/types";

export const SIZES: SizeOption[] = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "xxl", label: "2XL" },
  { value: "xxxl", label: "3XL" },
];

export const COLOURS: Record<string, ColourOption> = {
  brown: { value: "brown", label: "Chocolate", hex: "#4a342a" },
  olive: { value: "olive", label: "Olive", hex: "#4b5321" },
  purple: { value: "purple", label: "Royal Purple", hex: "#4b2e83" },
  heather: { value: "heather", label: "Heather Grey", hex: "#8a8d8f" },
  black: { value: "black", label: "Black", hex: "#1a1a1a" },
  bone: { value: "bone", label: "Bone", hex: "#ede6d6" },
};

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Best selling" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

export const PRICE_RANGE = { min: 0, max: 12000 };

export const DEFAULT_PER_PAGE = 9;

/** Fallback shipping weight (grams) for products saved before `weightGrams` existed — a folded tee/sweatshirt in its mailer, roughly. */
export const DEFAULT_GARMENT_WEIGHT_GRAMS = 300;

/**
 * Delivery options — all via Royal Mail, UK only. Standard delivery is free
 * once the order's item total after discounts reaches `freeOverPence` (£100);
 * express is always charged; collecting from the store (13 Skipsea Road,
 * Sheffield) is always free and needs no delivery address.
 * Prices are in pence and flat for
 * now (one band up to 20kg, Royal Mail's parcel limit). Split a band here —
 * or in Admin → Settings — to price by weight later.
 *
 * These seed `settings/store` (`npm run seed:settings`); checkout and the
 * Cloud Function read that doc, not this constant.
 */
export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    label: "Standard delivery",
    description: "Royal Mail Tracked 48",
    estimate: "Made in up to 14 days, then delivered in 2–5 working days",
    bands: [{ maxWeightGrams: 20000, price: 300 }],
    freeOverPence: 10000,
  },
  {
    id: "express",
    label: "Express delivery",
    description: "Royal Mail Tracked 24",
    estimate: "Made in up to 14 days, then delivered in 1–3 working days",
    bands: [{ maxWeightGrams: 20000, price: 900 }],
  },
  {
    id: "collection",
    label: "Collect from store",
    description: "13 Skipsea Road, Sheffield S2 1BT",
    estimate: "Ready within 14 days · collect Mon–Sat, 10am–6pm · we'll email you when it's ready",
    type: "collection",
    bands: [{ maxWeightGrams: 1_000_000, price: 0 }],
  },
];

export const RETURN_WINDOW_DAYS = 30;

/**
 * Tax added on top of the products' total after discounts — never on delivery.
 * Only a preview: the Cloud Function charges its own TAX_RATE
 * (functions/src/checkout.ts), so keep the two in sync.
 */
export const TAX_RATE = 0.025;

/** Pence of tax on an already-discounted product total. */
export function taxFor(discountedSubtotal: number): number {
  return Math.round(discountedSubtotal * TAX_RATE);
}
