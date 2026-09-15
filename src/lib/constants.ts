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
  olive: { value: "olive", label: "Olive", hex: "#4b5320" },
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
 * Royal Mail doesn't publish a live rate-quote API (confirmed against their
 * Click & Drop OpenAPI spec — it expects *you* to supply the shipping cost
 * when creating a shipment, it doesn't calculate one), so real fees have to
 * come from a weight-band table you maintain yourself, matching your actual
 * account rates. That table isn't sorted out yet — every band below is
 * priced at 0 (shipping is free on every order, current policy) so the
 * weight-based plumbing (Product.weightGrams, ShippingMethod.bands,
 * `priceForWeight` in functions/src/checkout.ts) is in place and ready:
 * fill in real prices here (and in Admin → Settings) once rates are decided,
 * with nothing else to rewire.
 */
export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    label: "Standard delivery",
    description: "Royal Mail Tracked 48",
    estimate: "2–4 working days",
    bands: [{ maxWeightGrams: 20000, price: 0 }],
  },
  {
    id: "express",
    label: "Express delivery",
    description: "Royal Mail Tracked 24",
    estimate: "1–2 working days",
    bands: [{ maxWeightGrams: 20000, price: 0 }],
  },
  {
    id: "collection",
    label: "Studio collection",
    description: "Collect from Peckham Levels, London",
    estimate: "Ready in 24 hours",
    bands: [{ maxWeightGrams: 1_000_000, price: 0 }],
  },
];

export const RETURN_WINDOW_DAYS = 30;
