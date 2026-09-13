"use client";

import Image from "next/image";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/format";

export function OrderSummary({
  shipping,
  discount = 0,
  discountLabel,
}: {
  shipping?: number;
  discount?: number;
  discountLabel?: string;
}) {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-medium">Order summary</h2>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-cream">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="64px"
                className="object-cover"
              />
              <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-navy text-[0.65rem] text-primary-foreground">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.colourLabel} · {item.size.toUpperCase()}
              </p>
            </div>
            <span className="text-sm">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <CartSummary
        subtotal={subtotal}
        shipping={shipping}
        discount={discount}
        discountLabel={discountLabel}
      />
    </div>
  );
}
