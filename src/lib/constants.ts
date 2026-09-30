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
 * Delivery options — all via Royal Mail, UK only. There's no free-delivery
 * threshold: every delivered order pays postage whatever the basket total;
 * only collecting from the studio is free. Prices are in pence and flat for
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
    estimate: "Delivered in 2–5 working days",
    bands: [{ maxWeightGrams: 20000, price: 300 }],
  },
  {
    id: "express",
    label: "Express delivery",
    description: "Royal Mail Tracked 24",
    estimate: "Delivered in 1–3 working days",
    bands: [{ maxWeightGrams: 20000, price: 900 }],
  },
  {
    id: "collection",
    label: "Collect from store",
    description: "Collect from Peckham Levels, London",
    estimate: "",
    bands: [{ maxWeightGrams: 1_000_000, price: 0 }],
  },
];

export const RETURN_WINDOW_DAYS = 30;
