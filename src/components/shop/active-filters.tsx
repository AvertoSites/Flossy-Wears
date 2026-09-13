"use client";

import { XIcon } from "lucide-react";
import { COLOURS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { useShopFilters } from "@/lib/hooks/use-shop-filters";
import type { ProductFilters } from "@/types";

export function ActiveFilters({ fixed = {} }: { fixed?: Partial<ProductFilters> }) {
  const { filters, setParam, toggleInList, activeCount, clearAll } =
    useShopFilters(fixed);

  if (activeCount === 0) return null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  filters.colours?.forEach((c) =>
    chips.push({
      key: `colour-${c}`,
      label: COLOURS[c]?.label ?? c,
      onRemove: () => toggleInList("colours", c),
    }),
  );
  filters.sizes?.forEach((s) =>
    chips.push({
      key: `size-${s}`,
      label: s.toUpperCase(),
      onRemove: () => toggleInList("sizes", s),
    }),
  );
  if (!fixed.type && filters.type)
    chips.push({
      key: "type",
      label: filters.type,
      onRemove: () => setParam({ type: undefined }),
    });
  if (!fixed.category && filters.category)
    chips.push({
      key: "category",
      label: filters.category,
      onRemove: () => setParam({ category: undefined }),
    });
  if (filters.minPrice || filters.maxPrice)
    chips.push({
      key: "price",
      label: `${formatPrice(filters.minPrice ?? 0)} – ${formatPrice(filters.maxPrice ?? 12000)}`,
      onRemove: () => setParam({ minPrice: undefined, maxPrice: undefined }),
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs capitalize transition-colors hover:border-navy"
        >
          {chip.label}
          <XIcon className="size-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
