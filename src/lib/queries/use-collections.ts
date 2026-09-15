"use client";

import { useQuery } from "@tanstack/react-query";
import type { Collection } from "@/types";

async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch("/api/collections");
  if (!res.ok) throw new Error("Failed to load collections");
  const data = (await res.json()) as { collections: Collection[] };
  return data.collections;
}

export function useCollectionsList() {
  return useQuery({
    queryKey: ["collections", "all"],
    queryFn: fetchCollections,
    staleTime: 5 * 60_000,
  });
}
