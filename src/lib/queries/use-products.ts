"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { Paginated, Product, ProductFilters } from "@/types";

function toParams(filters: ProductFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

async function fetchProducts(
  filters: ProductFilters,
): Promise<Paginated<Product>> {
  const res = await fetch(`/api/products?${toParams(filters)}`);
  if (!res.ok) throw new Error("Failed to load products");
  return (await res.json()) as Paginated<Product>;
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
