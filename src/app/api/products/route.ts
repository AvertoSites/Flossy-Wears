import type { NextRequest } from "next/server";
import { getProducts } from "@/lib/api";
import type { ProductBadge, ProductCategory, ProductFilters, ProductSort, ProductType } from "@/types";

function list(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function num(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;

  const filters: ProductFilters = {
    collection: sp.get("collection") ?? undefined,
    category: (sp.get("category") as ProductCategory) ?? undefined,
    type: (sp.get("type") as ProductType) ?? undefined,
    colours: list(sp.get("colours")),
    sizes: list(sp.get("sizes")),
    badges: list(sp.get("badges")) as ProductBadge[] | undefined,
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")),
    search: sp.get("search") ?? undefined,
    sort: (sp.get("sort") as ProductSort) ?? undefined,
    page: num(sp.get("page")),
    perPage: num(sp.get("perPage")),
  };

  const result = await getProducts(filters);
  return Response.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
