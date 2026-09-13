"use client";

import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { FreeShippingBar } from "@/components/cart/free-shipping-bar";
import { EmptyCart } from "@/components/cart/empty-cart";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { useMounted } from "@/lib/hooks/use-mounted";
import { pluralise } from "@/lib/format";

export function CartSheet() {
  const mounted = useMounted();
  const open = useUI((s) => s.cartOpen);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const count = useCart((s) => s.totalItems());

  const close = () => setCartOpen(false);
  const isEmpty = !mounted || items.length === 0;

  return (
    <Sheet open={open} onOpenChange={setCartOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBagIcon className="size-4" />
            Your bag
            {mounted && count > 0 && (
              <span className="text-muted-foreground">
                ({count} {pluralise(count, "item")})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <EmptyCart onNavigate={close} />
        ) : (
          <>
            <div className="border-b border-border px-6 py-4">
              <FreeShippingBar subtotal={subtotal} />
            </div>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-5 px-6 py-5">
                {items.map((item) => (
                  <CartLineItem
                    key={item.id}
                    item={item}
                    compact
                    onNavigate={close}
                  />
                ))}
              </div>
            </ScrollArea>
            <div className="flex flex-col gap-4 border-t border-border px-6 py-5">
              <CartSummary subtotal={subtotal} showShipping={false} />
              <div className="flex flex-col gap-2">
                <Button asChild size="lg" onClick={close}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  onClick={close}
                >
                  <Link href="/cart">View bag</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
