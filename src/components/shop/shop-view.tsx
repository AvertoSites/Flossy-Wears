"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/common/empty-state";
import { FiltersPanel } from "@/components/shop/filters-panel";
import { ActiveFilters } from "@/components/shop/active-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { Pagination } from "@/components/shop/pagination";
import { useShopFilters } from "@/lib/hooks/use-shop-filters";
import { useProducts } from "@/lib/queries/use-products";
import { pluralise } from "@/lib/format";
import type { ProductFilters, ProductSort } from "@/types";

export function ShopView({ fixed = {} }: { fixed?: Partial<ProductFilters> }) {
  const { filters, setParam } = useShopFilters(fixed);
  const { data, isPending, isPlaceholderData } = useProducts(filters);

  const products = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <FiltersPanel fixed={fixed} />
        </div>
      </aside>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {isPending ? "Loading…" : `${total} ${pluralise(total, "product")}`}
          </p>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontalIcon className="size-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">
                  <FiltersPanel fixed={fixed} />
                </div>
              </SheetContent>
            </Sheet>
            <SortSelect
              value={(filters.sort as ProductSort) ?? "featured"}
              onChange={(sort) => setParam({ sort })}
            />
          </div>
        </div>

        <ActiveFilters fixed={fixed} />

        {isPending ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[4/5] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products match those filters"
            description="Try removing a filter or two."
          />
        ) : (
          <div
            className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}
          >
            <ProductGrid products={products} />
          </div>
        )}

        <Pagination
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          onChange={(page) => {
            setParam({ page });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
}
