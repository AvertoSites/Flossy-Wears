"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartIcon, ShoppingBagIcon, TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Price } from "@/components/common/price";
import { RatingStars } from "@/components/common/rating-stars";
import { QuantityStepper } from "@/components/common/quantity-stepper";
import { ProductGallery } from "@/components/product/product-gallery";
import { SizeGuideDialog } from "@/components/product/size-guide-dialog";
import { ProductInfo } from "@/components/product/product-info";
import { useAddToCart } from "@/lib/hooks/use-add-to-cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useRecentlyViewed } from "@/lib/store/recently-viewed";
import { useMounted } from "@/lib/hooks/use-mounted";
import { DEFAULT_GARMENT_WEIGHT_GRAMS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductPurchase({ product }: { product: Product }) {
  const mounted = useMounted();
  const addToCart = useAddToCart();
  const inWishlist = useWishlist((s) => s.slugs.includes(product.slug));
  const toggleWishlist = useWishlist((s) => s.toggle);
  const addRecent = useRecentlyViewed((s) => s.add);

  const [colour, setColourState] = useState(product.colours[0].value);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  function setColour(next: string) {
    setColourState(next);
    setSize(null);
    setQty(1);
  }

  useEffect(() => {
    addRecent(product.slug);
  }, [addRecent, product.slug]);

  const variantsForColour = useMemo(
    () => product.variants.filter((v) => v.colour === colour),
    [product.variants, colour],
  );

  const variantImages = variantsForColour[0]?.images;
  const galleryImages = variantImages?.length ? variantImages : product.images;
  const selectedVariant = variantsForColour.find((v) => v.size === size) ?? null;
  const stockForSize = (s: string) =>
    variantsForColour.find((v) => v.size === s)?.stock ?? 0;

  const lowStock =
    selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3;

  function handleAdd() {
    if (!selectedVariant || !size) return;
    const colourLabel =
      product.colours.find((c) => c.value === colour)?.label ?? colour;
    addToCart(
      {
        id: `${product.id}:${colour}:${size}`,
        productId: product.id,
        variantId: selectedVariant.id,
        slug: product.slug,
        name: product.name,
        colour,
        colourLabel,
        size,
        price: selectedVariant.price.amount,
        compareAtPrice: selectedVariant.compareAtPrice?.amount,
        image: galleryImages[0],
        maxStock: selectedVariant.stock,
        weightGrams: product.weightGrams ?? DEFAULT_GARMENT_WEIGHT_GRAMS,
      },
      qty,
    );
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={galleryImages} alt={product.name} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.badges.map((badge) => (
                <Badge
                  key={badge}
                  className={cn(
                    "capitalize",
                    badge === "sale"
                      ? "bg-destructive text-white"
                      : "bg-cream text-navy",
                  )}
                >
                  {badge}
                </Badge>
              ))}
              {product.needsPhotography && (
                <Badge variant="outline" className="text-muted-foreground">
                  Sample imagery
                </Badge>
              )}
            </div>
            <h1 className="text-3xl">{product.name}</h1>
            <p className="text-sm text-muted-foreground">
              {product.verse.text} — {product.verse.reference}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <RatingStars value={product.rating} size={16} />
              <a
                href="#reviews"
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                {product.reviewCount} reviews
              </a>
            </div>
            <Price
              value={selectedVariant?.price.amount ?? product.price.amount}
              compareAt={
                selectedVariant?.compareAtPrice?.amount ??
                product.compareAtPrice?.amount
              }
              className="mt-2 text-xl"
            />
          </div>

          {/* Colour */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">
              Colour:{" "}
              <span className="text-muted-foreground">
                {product.colours.find((c) => c.value === colour)?.label}
              </span>
            </span>
            <div className="flex flex-wrap gap-2">
              {product.colours.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColour(c.value)}
                  aria-pressed={colour === c.value}
                  title={c.label}
                  className={cn(
                    "size-9 rounded-full border transition-[outline]",
                    colour === c.value &&
                      "outline outline-2 outline-offset-2 outline-gold",
                  )}
                  style={{ backgroundColor: c.hex }}
                >
                  <span className="sr-only">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Size</span>
              <SizeGuideDialog />
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const stock = stockForSize(s.value);
                const soldOut = stock === 0;
                return (
                  <button
                    key={s.value}
                    type="button"
                    disabled={soldOut}
                    onClick={() => setSize(s.value)}
                    aria-pressed={size === s.value}
                    className={cn(
                      "min-w-12 rounded-md border px-3 py-2 text-sm transition-colors",
                      size === s.value
                        ? "border-navy bg-navy text-primary-foreground"
                        : "border-input hover:border-navy",
                      soldOut &&
                        "cursor-not-allowed border-dashed text-muted-foreground line-through hover:border-input",
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            {mounted && lowStock && (
              <p className="text-xs text-destructive">
                Only {selectedVariant!.stock} left in this size
              </p>
            )}
          </div>

          {/* Quantity + actions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <QuantityStepper
                value={qty}
                onChange={setQty}
                max={selectedVariant?.stock ?? 10}
              />
              <Button
                size="lg"
                className="flex-1"
                disabled={!selectedVariant}
                onClick={handleAdd}
              >
                <ShoppingBagIcon className="size-4" />
                {selectedVariant
                  ? `Add to bag · ${formatPrice(selectedVariant.price.amount * qty)}`
                  : size
                    ? "Unavailable"
                    : "Select a size"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                aria-label="Add to wishlist"
                aria-pressed={mounted ? inWishlist : undefined}
                onClick={() => toggleWishlist(product.slug)}
              >
                <HeartIcon
                  className={cn(
                    "size-4",
                    mounted && inWishlist && "fill-gold text-gold",
                  )}
                />
              </Button>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <TruckIcon className="size-4" />
              Free UK delivery
              {" · "}
              Dispatched in 1–2 working days
            </p>
          </div>

          <ProductInfo product={product} />
        </div>
      </div>
    </div>
  );
}
