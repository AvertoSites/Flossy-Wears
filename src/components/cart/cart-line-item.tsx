"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2Icon } from "lucide-react";
import { QuantityStepper } from "@/components/common/quantity-stepper";
import { Price } from "@/components/common/price";
import { useCart } from "@/lib/store/cart";
import type { CartItem } from "@/types";
import { cn } from "@/lib/utils";

export function CartLineItem({
  item,
  compact = false,
  onNavigate,
}: {
  item: CartItem;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);

  return (
    <div className="flex gap-4">
      <Link
        href={`/products/${item.slug}`}
        onClick={onNavigate}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-md border border-border bg-cream",
          compact
            ? "size-20 min-[380px]:size-24 sm:size-20"
            : "size-20 min-[380px]:size-24 sm:size-28",
        )}
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="120px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${item.slug}`}
            onClick={onNavigate}
            className="min-w-0 break-words text-base font-medium leading-snug hover:underline sm:text-sm"
          >
            {item.name}
          </Link>
          <Price
            value={item.price * item.quantity}
            compareAt={
              item.compareAtPrice ? item.compareAtPrice * item.quantity : undefined
            }
            className="shrink-0 flex-col items-end gap-0 text-base sm:flex-row sm:items-baseline sm:gap-2 sm:text-sm"
          />
        </div>
        <p className="text-sm text-muted-foreground sm:text-xs">
          {item.colourLabel} · {item.size.toUpperCase()}
        </p>
        {item.customVerse && (
          <p className="text-sm italic text-gold-dark sm:text-xs">
            &ldquo;{item.customVerse.text}&rdquo; — {item.customVerse.reference}
            {item.customVerse.note && (
              <span className="block not-italic text-muted-foreground">
                Note: {item.customVerse.note}
              </span>
            )}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <QuantityStepper
            value={item.quantity}
            min={1}
            max={item.maxStock}
            size="sm"
            onChange={(q) => setQuantity(item.id, q)}
          />
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground sm:text-xs transition-colors hover:text-destructive"
          >
            <Trash2Icon className="size-4 sm:size-3.5" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
