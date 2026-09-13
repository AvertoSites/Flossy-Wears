import { products } from "@/lib/data/products";
import { DEFAULT_PER_PAGE } from "@/lib/constants";
import type {
  Paginated,
  Product,
  ProductFilters,
  ProductSort,
} from "@/types";

/**
 * Mock product access. Every function is async and returns plain data so the
 * implementation can be swapped for Firestore without touching callers.
 */

function sortProducts(list: Product[], sort: ProductSort = "featured"): Product[] {
  const copy = [...list];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "price-asc":
      return copy.sort((a, b) => a.price.amount - b.price.amount);
    case "price-desc":
      return copy.sort((a, b) => b.price.amount - a.price.amount);
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "bestselling":
      return copy.sort((a, b) => b.reviewCount - a.reviewCount);
    case "featured":
    default:
      return copy.sort((a, b) => {
        const score = (p: Product) =>
          (p.badges.includes("bestseller") ? 2 : 0) +
          (p.badges.includes("new") ? 1 : 0);
        return score(b) - score(a) || b.rating - a.rating;
      });
  }
}

function matches(product: Product, f: ProductFilters): boolean {
  if (f.collection && !product.collectionSlugs.includes(f.collection)) return false;
  if (f.category && product.category !== f.category && product.category !== "unisex")
    return false;
  if (f.type && product.type !== f.type) return false;
  if (f.colours?.length && !f.colours.some((c) => product.colours.some((pc) => pc.value === c)))
    return false;
  if (f.sizes?.length && !f.sizes.some((s) => product.sizes.some((ps) => ps.value === s)))
    return false;
  if (typeof f.minPrice === "number" && product.price.amount < f.minPrice) return false;
  if (typeof f.maxPrice === "number" && product.price.amount > f.maxPrice) return false;
  if (f.badges?.length && !f.badges.some((b) => product.badges.includes(b))) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    const haystack = `${product.name} ${product.tagline} ${product.verse.text} ${product.verse.reference} ${product.type}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<Paginated<Product>> {
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const page = Math.max(1, filters.page ?? 1);

  const filtered = products.filter((p) => matches(p, filters));
  const sorted = sortProducts(filtered, filters.sort);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const items = sorted.slice(start, start + perPage);

  return { items, total, page, perPage, totalPages };
}

export async function getAllProducts(): Promise<Product[]> {
  return products;
}

export async function getProduct(slug: string): Promise<Product | null> {
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCollection(slug: string): Promise<Product[]> {
  return products.filter((p) => p.collectionSlugs.includes(slug));
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return sortProducts(products, "featured").slice(0, limit);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return sortProducts(products, "newest").slice(0, limit);
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  const product = products.find((p) => p.slug === slug);
  if (!product) return [];
  const scored = products
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      p,
      score:
        p.collectionSlugs.filter((c) => product.collectionSlugs.includes(c)).length * 2 +
        (p.type === product.type ? 1 : 0) +
        (p.category === product.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating);
  return scored.slice(0, limit).map((s) => s.p);
}

export async function searchProducts(query: string, limit = 8): Promise<Product[]> {
  if (!query.trim()) return [];
  const { items } = await getProducts({ search: query, perPage: limit });
  return items;
}

export async function getProductSlugs(): Promise<string[]> {
  return products.map((p) => p.slug);
}
