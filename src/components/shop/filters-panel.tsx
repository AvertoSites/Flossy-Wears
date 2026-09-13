"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { COLOURS, PRICE_RANGE, SIZES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { useShopFilters } from "@/lib/hooks/use-shop-filters";
import type { ProductFilters } from "@/types";
import { useState } from "react";

const TYPES = [
  { value: "sweatshirt", label: "Sweatshirts" },
  { value: "t-shirt", label: "T-shirts" },
  { value: "hoodie", label: "Hoodies" },
];

const CATEGORIES = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "unisex", label: "Unisex" },
];

export function FiltersPanel({
  fixed = {},
}: {
  fixed?: Partial<ProductFilters>;
}) {
  const { filters, setParam, toggleInList, clearAll, activeCount } =
    useShopFilters(fixed);
  const [range, setRange] = useState<number[]>([
    filters.minPrice ?? PRICE_RANGE.min,
    filters.maxPrice ?? PRICE_RANGE.max,
  ]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between pb-2">
        <span className="text-sm font-medium">
          Filters{activeCount > 0 && ` (${activeCount})`}
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={["type", "colour", "size", "price"]}
      >
        {!fixed.type && (
          <AccordionItem value="type">
            <AccordionTrigger>Product</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              {TYPES.map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={filters.type === t.value}
                    onCheckedChange={(checked) =>
                      setParam({ type: checked ? t.value : undefined })
                    }
                  />
                  {t.label}
                </label>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {!fixed.category && (
          <AccordionItem value="category">
            <AccordionTrigger>Shop by</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              {CATEGORIES.map((c) => (
                <label key={c.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={filters.category === c.value}
                    onCheckedChange={(checked) =>
                      setParam({ category: checked ? c.value : undefined })
                    }
                  />
                  {c.label}
                </label>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="colour">
          <AccordionTrigger>Colour</AccordionTrigger>
          <AccordionContent className="flex flex-wrap gap-2">
            {Object.values(COLOURS).map((colour) => {
              const active = filters.colours?.includes(colour.value);
              return (
                <button
                  key={colour.value}
                  type="button"
                  onClick={() => toggleInList("colours", colour.value)}
                  aria-pressed={active}
                  title={colour.label}
                  className="grid size-8 place-items-center rounded-full border transition-[outline] data-[active=true]:outline data-[active=true]:outline-2 data-[active=true]:outline-offset-2 data-[active=true]:outline-gold"
                  data-active={active}
                  style={{ backgroundColor: colour.hex }}
                >
                  <span className="sr-only">{colour.label}</span>
                </button>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="size">
          <AccordionTrigger>Size</AccordionTrigger>
          <AccordionContent className="flex flex-wrap gap-2">
            {SIZES.map((size) => {
              const active = filters.sizes?.includes(size.value);
              return (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => toggleInList("sizes", size.value)}
                  aria-pressed={active}
                  className="min-w-11 rounded-md border px-2 py-1.5 text-xs transition-colors data-[active=true]:border-navy data-[active=true]:bg-navy data-[active=true]:text-primary-foreground"
                  data-active={active}
                >
                  {size.label}
                </button>
              );
            })}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger>Price</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 pt-2">
            <Slider
              min={PRICE_RANGE.min}
              max={PRICE_RANGE.max}
              step={500}
              value={range}
              onValueChange={setRange}
              onValueCommit={(v) =>
                setParam({
                  minPrice: v[0] > PRICE_RANGE.min ? v[0] : undefined,
                  maxPrice: v[1] < PRICE_RANGE.max ? v[1] : undefined,
                })
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatPrice(range[0])}</span>
              <span>{formatPrice(range[1])}</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
