"use client";

import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/types";

async function fetchSearch(query: string): Promise<Product[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  const data = (await res.json()) as { items: Product[] };
  return data.items;
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchSearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
