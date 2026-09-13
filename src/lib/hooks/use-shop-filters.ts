"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_PER_PAGE } from "@/lib/constants";
import type { ProductBadge, ProductCategory, ProductFilters, ProductSort, ProductType } from "@/types";

type ListKey = "colours" | "sizes" | "badges";

export function useShopFilters(fixed: Partial<ProductFilters> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo<ProductFilters>(() => {
    const get = (k: string) => params.get(k) ?? undefined;
    const list = (k: string) => {
      const v = params.get(k);
      return v ? v.split(",").filter(Boolean) : undefined;
    };
    return {
      ...fixed,
      category: (get("category") as ProductCategory) ?? fixed.category,
      type: (get("type") as ProductType) ?? fixed.type,
      colours: list("colours"),
      sizes: list("sizes"),
      badges: (list("badges") as ProductBadge[]) ?? fixed.badges,
      minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
      maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
      search: get("search"),
      sort: (get("sort") as ProductSort) ?? "featured",
      page: get("page") ? Number(get("page")) : 1,
      perPage: fixed.perPage ?? DEFAULT_PER_PAGE,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setParam = useCallback(
    (updates: Record<string, string | string[] | number | undefined>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          next.delete(key);
        } else {
          next.set(key, Array.isArray(value) ? value.join(",") : String(value));
        }
      });
      // Any filter change resets pagination.
      if (!("page" in updates)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const toggleInList = useCallback(
    (key: ListKey, value: string) => {
      const current = filters[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setParam({ [key]: next });
    },
    [filters, setParam],
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams();
    if (params.get("search")) next.set("search", params.get("search")!);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const activeCount =
    (filters.colours?.length ?? 0) +
    (filters.sizes?.length ?? 0) +
    (filters.badges?.length ?? 0) +
    (filters.category && !fixed.category ? 1 : 0) +
    (filters.type && !fixed.type ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0);

  return { filters, setParam, toggleInList, clearAll, activeCount };
}
