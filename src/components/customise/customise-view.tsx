"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuantityStepper } from "@/components/common/quantity-stepper";
import { useAddToCart } from "@/lib/hooks/use-add-to-cart";
import { DEFAULT_GARMENT_WEIGHT_GRAMS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const VERSE_MAX = 140;
const REFERENCE_MAX = 40;

/** Short, stable id suffix so different custom verses on the same size/colour don't collide in cart. */
function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function CustomiseView({ products }: { products: Product[] }) {
  const addToCart = useAddToCart();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    products[0]?.slug ?? null,
  );
  const [verseText, setVerseText] = useState("");
  const [reference, setReference] = useState("");
  const [colour, setColourState] = useState(products[0]?.colours[0]?.value ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const product = products.find((p) => p.slug === selectedSlug) ?? null;

  function selectProduct(next: Product) {
    setSelectedSlug(next.slug);
    setColourState(next.colours[0]?.value ?? "");
    setSize(null);
    setQty(1);
  }

  function setColour(next: string) {
    setColourState(next);
    setSize(null);
  }

  const variantsForColour = useMemo(
    () => product?.variants.filter((v) => v.colour === colour) ?? [],
    [product, colour],
  );
  const selectedVariant = variantsForColour.find((v) => v.size === size) ?? null;
  const stockForSize = (s: string) =>
    variantsForColour.find((v) => v.size === s)?.stock ?? 0;
  const previewImage = variantsForColour[0]?.images[0] ?? product?.images[0];

  const trimmedText = verseText.trim();
  const trimmedReference = reference.trim();
  const canAdd = !!selectedVariant && !!trimmedText && !!trimmedReference;

  function handleAdd() {
    if (!product || !selectedVariant || !size || !canAdd) return;
    const colourLabel =
      product.colours.find((c) => c.value === colour)?.label ?? colour;
    const customVerse = { text: trimmedText, reference: trimmedReference };
    addToCart(
      {
        id: `${product.id}:${colour}:${size}:custom-${hashText(`${trimmedText}|${trimmedReference}`)}`,
        productId: product.id,
        variantId: selectedVariant.id,
        slug: product.slug,
        name: product.name,
        colour,
        colourLabel,
        size,
        price: selectedVariant.price.amount,
        compareAtPrice: selectedVariant.compareAtPrice?.amount,
        image: previewImage ?? product.images[0],
        maxStock: selectedVariant.stock,
        weightGrams: product.weightGrams ?? DEFAULT_GARMENT_WEIGHT_GRAMS,
        customVerse,
      },
      qty,
    );
    setVerseText("");
    setReference("");
  }

  if (products.length === 0) {
    return (
      <div className="container-page py-14 text-sm text-muted-foreground">
        Customisation isn&rsquo;t available right now — check back soon.
      </div>
    );
  }

  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-medium">1. Pick a design</h2>
          <p className="text-xs text-muted-foreground">
            Any of these can be reprinted with your own verse.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => selectProduct(p)}
              aria-pressed={p.slug === selectedSlug}
              className={cn(
                "relative aspect-[4/5] overflow-hidden rounded-lg border bg-cream transition-[outline]",
                p.slug === selectedSlug
                  ? "outline outline-2 outline-offset-2 outline-gold"
                  : "border-border",
              )}
            >
              <Image
                src={p.images[0]}
                alt={p.name}
                fill
                sizes="(min-width: 1024px) 18vw, 40vw"
                className="object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-navy/80 px-2 py-1.5 text-left text-xs text-primary-foreground">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {product && (
        <div className="flex flex-col gap-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
            {previewImage && (
              <Image
                src={previewImage}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            )}
            {(trimmedText || trimmedReference) && (
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-md bg-paper/85 px-4 py-3 text-center backdrop-blur-sm">
                {trimmedText && (
                  <p className="font-display text-lg leading-snug text-navy">
                    &ldquo;{trimmedText}&rdquo;
                  </p>
                )}
                {trimmedReference && (
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-gold-dark">
                    {trimmedReference}
                  </p>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Preview only — the final print keeps {product.name}&rsquo;s layout
            and typeface, just with your words in place of &ldquo;
            {product.verse.text}&rdquo;.
          </p>

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium">2. Your verse</h2>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="verse-text">Verse</Label>
              <Textarea
                id="verse-text"
                rows={3}
                maxLength={VERSE_MAX}
                placeholder={`e.g. "${product.verse.text}"`}
                value={verseText}
                onChange={(e) => setVerseText(e.target.value)}
              />
              <span className="self-end text-xs text-muted-foreground">
                {verseText.length}/{VERSE_MAX}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="verse-reference">Book &amp; chapter</Label>
              <Input
                id="verse-reference"
                maxLength={REFERENCE_MAX}
                placeholder={`e.g. "${product.verse.reference}"`}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

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

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Size</span>
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
          </div>

          <div className="flex items-center gap-3">
            <QuantityStepper
              value={qty}
              onChange={setQty}
              max={selectedVariant?.stock ?? 10}
            />
            <Button
              size="lg"
              className="flex-1"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              <ShoppingBagIcon className="size-4" />
              {!size
                ? "Select a size"
                : !trimmedText || !trimmedReference
                  ? "Add your verse to continue"
                  : selectedVariant
                    ? `Add to bag · ${formatPrice(selectedVariant.price.amount * qty)}`
                    : "Unavailable"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Made to order for you — dispatched in 5–7 working days rather than
            our usual 1–2, since it&rsquo;s printed fresh once you order.
          </p>
        </div>
      )}
    </div>
  );
}
