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

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    label: "Standard delivery",
    description: "Royal Mail Tracked 48",
    price: 395,
    estimate: "2–4 working days",
  },
  {
    id: "express",
    label: "Express delivery",
    description: "Royal Mail Tracked 24",
    price: 595,
    estimate: "1–2 working days",
  },
  {
    id: "collection",
    label: "Studio collection",
    description: "Collect from Peckham Levels, London",
    price: 0,
    estimate: "Ready in 24 hours",
  },
];

export const RETURN_WINDOW_DAYS = 30;
