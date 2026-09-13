"use client";

import Image from "next/image";
import Link from "next/link";
import { HeartIcon } from "lucide-react";
import { Price } from "@/components/common/price";
import { RatingStars } from "@/components/common/rating-stars";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/lib/store/wishlist";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const BADGE_LABEL: Record<string, string> = {
  new: "New",
  bestseller: "Best seller",
  restock: "Back in stock",
  sale: "Sale",
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const mounted = useMounted();
  const inWishlist = useWishlist((s) => s.slugs.includes(product.slug));
  const toggle = useWishlist((s) => s.toggle);

  const primary = product.images[0];
  const secondary = product.images[1] ?? product.images[0];
  const topBadge = product.badges[0];

  return (
    <div className="group relative flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-lg bg-cream"
      >
        <Image
          src={primary}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        <Image
          src={secondary}
          alt=""
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        {topBadge && (
          <Badge
            className={cn(
              "absolute left-3 top-3",
              topBadge === "sale"
                ? "bg-destructive text-white"
                : "bg-paper text-navy",
            )}
          >
            {BADGE_LABEL[topBadge]}
          </Badge>
        )}
      </Link>

      <button
        type="button"
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={mounted ? inWishlist : undefined}
        onClick={() => toggle(product.slug)}
        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-paper/90 text-navy backdrop-blur transition-colors hover:bg-paper"
      >
        <HeartIcon
          className={cn("size-4", mounted && inWishlist && "fill-gold text-gold")}
        />
      </button>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="text-sm font-medium leading-snug hover:underline"
          >
            {product.name}
          </Link>
          <Price
            value={product.price.amount}
            compareAt={product.compareAtPrice?.amount}
            className="shrink-0 text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground">{product.verse.reference}</p>
        <div className="mt-1 flex items-center gap-2">
          <RatingStars value={product.rating} size={13} />
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {product.colours.map((colour) => (
            <span
              key={colour.value}
              title={colour.label}
              className="size-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: colour.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
