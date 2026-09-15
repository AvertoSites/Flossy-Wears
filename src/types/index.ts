/**
 * Domain model for the Flossy Wears storefront.
 *
 * Prices are integers in **pence** (GBP). Format at the edge with `formatPrice`.
 * This layer is storage-agnostic: the same shapes are returned by the mock
 * `src/lib/api` today and by Firebase later.
 */

export type Currency = "GBP";

export type Money = {
  /** Integer minor units (pence). */
  amount: number;
  currency: Currency;
};

export type ProductCategory = "men" | "women" | "unisex";

export type ProductType = "sweatshirt" | "t-shirt" | "hoodie";

export type ProductBadge = "new" | "bestseller" | "restock" | "sale";

export type ColourOption = {
  /** Stable key, e.g. "olive". */
  value: string;
  label: string;
  /** CSS colour for the swatch dot. */
  hex: string;
};

export type SizeOption = {
  value: string;
  label: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  colour: string;
  size: string;
  price: Money;
  compareAtPrice?: Money;
  stock: number;
  /** Ordered image URLs specific to this colourway. */
  images: string[];
};

export type Verse = {
  text: string;
  reference: string;
};

/** A shopper's own verse + reference, swapped in for a design's printed text. */
export type CustomVerse = {
  text: string;
  reference: string;
  /** Optional shopper note — placement requests, special instructions, etc. */
  note?: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Short marketing line. */
  tagline: string;
  description: string;
  verse: Verse;
  type: ProductType;
  category: ProductCategory;
  collectionSlugs: string[];
  /** Default price shown before a variant is chosen. */
  price: Money;
  compareAtPrice?: Money;
  colours: ColourOption[];
  sizes: SizeOption[];
  variants: ProductVariant[];
  /** Fallback gallery when no colour is selected. */
  images: string[];
  badges: ProductBadge[];
  rating: number;
  reviewCount: number;
  fabric: string;
  care: string[];
  fit: string;
  /** Shipping weight in grams — drives Royal Mail band pricing at checkout. Absent on products seeded before this field existed; callers fall back to DEFAULT_GARMENT_WEIGHT_GRAMS. */
  weightGrams?: number;
  /** Flagged where real photography is still needed. */
  needsPhotography?: boolean;
  /** Admin toggle — hidden from storefront when false. */
  active?: boolean;
  /** Can be used as a base design on the "Customise Your Own" page. */
  customizable?: boolean;
  createdAt: string;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  heroImage: string;
  /** Editorial eyebrow, e.g. "The October 2026 drop". */
  eyebrow?: string;
  featured: boolean;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  verified: boolean;
};

export type CartItem = {
  /** `${productId}:${colour}:${size}` */
  id: string;
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  colour: string;
  colourLabel: string;
  size: string;
  /** Unit price in pence. */
  price: number;
  compareAtPrice?: number;
  image: string;
  quantity: number;
  maxStock: number;
  /** Shipping weight in grams, denormalized from the product at add-to-cart time — used for a client-side delivery estimate only; the server re-derives it from the real product doc at checkout. */
  weightGrams: number;
  /** Present when the shopper swapped in their own verse for this design. */
  customVerse?: CustomVerse;
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
  isDefault?: boolean;
};

export type ShippingBand = {
  /** Parcels up to this weight (grams) are charged `price` — the first matching band, in ascending order, applies. */
  maxWeightGrams: number;
  /** Pence. 0 = free. */
  price: number;
};

export type ShippingMethod = {
  id: string;
  label: string;
  description: string;
  /** Ascending by maxWeightGrams. A parcel heavier than the last band can't ship via this method. */
  bands: ShippingBand[];
  estimate: string;
};

export type OrderStatus =
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderLine = {
  name: string;
  colourLabel: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
  /** Present when the shopper swapped in their own verse for this design. */
  customVerse?: CustomVerse;
  /** Set by createCheckoutSession — lets fulfillment decrement the exact variant's stock. */
  productId?: string;
  variantId?: string;
};

export type PaymentStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "partially_refunded";

export type OrderEventKind =
  | "placed"
  | "payment"
  | "fulfillment"
  | "note"
  | "refund"
  | "notification";

export type OrderEvent = {
  id: string;
  at: string;
  kind: OrderEventKind;
  label: string;
  detail?: string;
};

export type OrderNote = {
  id: string;
  at: string;
  author: string;
  body: string;
};

export type Order = {
  id: string;
  number: string;
  status: OrderStatus;
  placedAt: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: Address;
  shippingMethod: string;
  trackingUrl?: string;
  /** Admin / fulfillment fields. */
  customerEmail?: string;
  customerName?: string;
  paymentStatus?: PaymentStatus;
  stripePaymentIntentId?: string;
  refundedAmount?: number;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  timeline?: OrderEvent[];
  notes?: OrderNote[];
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Aggregates, populated by the admin data layer. */
  orderCount?: number;
  totalSpent?: number;
  lastOrderAt?: string;
  createdAt?: string;
};

export type Discount = {
  code: string;
  label: string;
  percentOff: number;
  active: boolean;
  timesUsed: number;
  createdAt: string;
};

export type StoreSettings = {
  storeName: string;
  supportEmail: string;
  shippingMethods: ShippingMethod[];
};

export type AdminReview = Review & { published: boolean; productName?: string };

export type LowStockRow = {
  productId: string;
  slug: string;
  name: string;
  variantId: string;
  colour: string;
  size: string;
  stock: number;
};

export type PaymentsOverview = {
  live: boolean;
  balance: { available: number; pending: number };
  payments: {
    id: string;
    orderNumber: string;
    customer: string;
    amount: number;
    refunded: number;
    status: string;
    createdAt: string;
  }[];
};

export type AdminSummary = {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  unitsSold: number;
  awaitingFulfillment: number;
  lowStockCount: number;
  refundedAmount: number;
  revenueByDay: { date: string; total: number }[];
  statusBreakdown: { status: OrderStatus; count: number }[];
};

export type ProductSort =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "bestselling";

export type ProductFilters = {
  collection?: string;
  category?: ProductCategory;
  type?: ProductType;
  colours?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  badges?: ProductBadge[];
  search?: string;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
