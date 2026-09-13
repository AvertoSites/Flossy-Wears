"use client";

import { useQuery } from "@tanstack/react-query";
import type { Paginated, Product } from "@/types";

async function fetchAll(): Promise<Product[]> {
  const res = await fetch("/api/products?perPage=100");
  if (!res.ok) throw new Error("Failed to load products");
  const data = (await res.json()) as Paginated<Product>;
  return data.items;
}

export function useAllProducts() {
  return useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchAll,
    staleTime: 5 * 60_000,
  });
}
