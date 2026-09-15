"use client";

import Link from "next/link";
import { useState } from "react";
import { TagIcon, TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { useCart } from "@/lib/store/cart";
import { useMounted } from "@/lib/hooks/use-mounted";
import { pluralise } from "@/lib/format";

type PromoPreview = { code: string; label: string; discountPence: number };

export function CartPageView() {
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const count = useCart((s) => s.totalItems());
  const setDiscountCode = useCart((s) => s.setDiscountCode);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

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
          <p className="flex items-center gap-2 text-sm text-gold-dark">
            <TruckIcon className="size-4" />
            Free UK delivery
          </p>
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
            onSubmit={async (e) => {
              e.preventDefault();
              setChecking(true);
              try {
                const res = await fetch("/api/discounts/validate", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ code: promoInput, subtotalPence: subtotal }),
                });
                if (!res.ok) {
                  setPromo(null);
                  setDiscountCode(null);
                  setPromoError("That code isn't valid");
                  return;
                }
                const data = (await res.json()) as PromoPreview;
                setPromo(data);
                setDiscountCode(data.code);
                setPromoError(null);
              } finally {
                setChecking(false);
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
            <Button type="submit" variant="outline" disabled={checking}>
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
