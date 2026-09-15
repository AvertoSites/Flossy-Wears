"use client";

import { useQuery } from "@tanstack/react-query";
import type { StoreSettings } from "@/types";

async function fetchSettings(): Promise<StoreSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to load store settings");
  const data = (await res.json()) as { settings: StoreSettings };
  return data.settings;
}

/** Real admin-editable settings (shipping methods) — replaces the hardcoded SHIPPING_METHODS constant in client components. */
export function useStoreSettings() {
  return useQuery({
    queryKey: ["settings", "store"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
}
