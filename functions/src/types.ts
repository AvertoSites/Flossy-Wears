/**
 * Minimal duplicate of the shapes this codebase already defines in
 * `src/types/index.ts` — the Cloud Functions codebase is a separate
 * TypeScript project (its own `tsconfig.json`/deploy) so it can't import
 * across the `functions/` boundary via the app's `@/` path alias. Keep these
 * in sync with `src/types/index.ts` if either changes shape.
 */

export type Money = { amount: number; currency: "GBP" };

export type CustomVerse = { text: string; reference: string; note?: string };

export type ProductVariant = {
  id: string;
  sku: string;
  colour: string;
  size: string;
  price: Money;
  stock: number;
};

export type ColourOption = { value: string; label: string; hex: string };

export type Product = {
  id: string;
  name: string;
  active?: boolean;
  customizable?: boolean;
  colours: ColourOption[];
  variants: ProductVariant[];
  /** Shipping weight in grams — drives Royal Mail band pricing at checkout. */
  weightGrams?: number;
};

export type Address = {
  id: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  phone?: string;
};

export type ShippingBand = { maxWeightGrams: number; price: number };

export type ShippingMethod = {
  id: string;
  label: string;
  description: string;
  bands: ShippingBand[];
  estimate: string;
};

export type StoreSettings = {
  storeName: string;
  supportEmail: string;
  shippingMethods: ShippingMethod[];
};

export type OrderLine = {
  name: string;
  colourLabel: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
  customVerse?: CustomVerse;
  productId: string;
  variantId: string;
};

export type CheckoutLineInput = {
  productId: string;
  variantId: string;
  quantity: number;
  image: string;
  customVerse?: CustomVerse;
};
