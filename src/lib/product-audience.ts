import type { Product, ProductCategory } from "@/types";

/**
 * "For Him" / "For Her" membership is derived from a product's category rather
 * than hand-ticked collections, so it always agrees with the Men / Women shop
 * filter (which also counts unisex pieces for both).
 */
export const AUDIENCE_COLLECTIONS: Record<string, ProductCategory> = {
  "for-him": "men",
  "for-her": "women",
};

export function isAudienceCollection(slug: string): boolean {
  return slug in AUDIENCE_COLLECTIONS;
}

export function inCollection(
  product: Pick<Product, "category" | "collectionSlugs">,
  slug: string,
): boolean {
  const audience = AUDIENCE_COLLECTIONS[slug];
  if (audience) return product.category === audience || product.category === "unisex";
  return product.collectionSlugs.includes(slug);
}
