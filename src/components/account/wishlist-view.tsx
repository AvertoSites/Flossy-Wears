"use client";

import { HeartIcon } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/lib/store/wishlist";
import { useAllProducts } from "@/lib/queries/use-all-products";
import { useMounted } from "@/lib/hooks/use-mounted";

export function WishlistView() {
  const mounted = useMounted();
  const slugs = useWishlist((s) => s.slugs);
  const { data, isPending } = useAllProducts();

  if (!mounted || isPending) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const products = (data ?? []).filter((p) => slugs.includes(p.slug));

  if (products.length === 0) {
    return (
      <EmptyState
        icon={HeartIcon}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here."
        action={{ label: "Browse the line", href: "/shop" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Wishlist ({products.length})</h2>
      <ProductGrid products={products} />
    </div>
  );
}
