"use client";

import Link from "next/link";
import { useState } from "react";
import { TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { FreeShippingBar } from "@/components/cart/free-shipping-bar";
import { EmptyCart } from "@/components/cart/empty-cart";
import { useCart } from "@/lib/store/cart";
import { useMounted } from "@/lib/hooks/use-mounted";
import { applyPromo } from "@/lib/api/checkout";
import { pluralise } from "@/lib/format";

export function CartPageView() {
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const count = useCart((s) => s.totalItems());
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<ReturnType<typeof applyPromo>>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!mounted || items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyCart />
      </div>
    );
  }

  const discount = promo?.discountPence ?? 0;

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl">Your bag</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {count} {pluralise(count, "item")}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <FreeShippingBar subtotal={subtotal} />
          <div className="flex flex-col divide-y divide-border border-y border-border">
            {items.map((item) => (
              <div key={item.id} className="py-6 first:pt-0 last:pb-0">
                <CartLineItem item={item} />
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-lg font-medium">Order summary</h2>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const result = applyPromo(promoInput, subtotal);
              if (result) {
                setPromo(result);
                setPromoError(null);
              } else {
                setPromo(null);
                setPromoError("That code isn't valid");
              }
            }}
          >
            <div className="relative flex-1">
              <TagIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
          {promoError && <p className="text-xs text-destructive">{promoError}</p>}
          {promo && (
            <p className="text-xs text-gold-dark">{promo.label} applied</p>
          )}

          <CartSummary
            subtotal={subtotal}
            discount={discount}
            discountLabel={promo?.code}
          />

          <Button asChild size="lg">
            <Link href="/checkout">Checkout</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
