"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store/cart";

export function CheckoutSuccessView() {
  const params = useSearchParams();
  const clear = useCart((s) => s.clear);
  const [orderNo] = useState(
    () => `FW-${Math.floor(1000 + Math.random() * 9000)}`,
  );

  useEffect(() => {
    clear();
  }, [clear]);

  const isMock = params.get("mock") === "1";

  return (
    <div className="container-page flex flex-col items-center gap-6 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-cream text-gold-dark">
        <CircleCheckIcon className="size-8" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl">Thank you — your order is confirmed</h1>
        <p className="text-muted-foreground">
          Order <span className="font-medium text-foreground">{orderNo}</span>. A
          confirmation email is on its way. We&rsquo;ll let you know when it ships.
        </p>
      </div>
      {isMock && (
        <p className="max-w-md rounded-md border border-dashed border-border bg-cream/50 px-4 py-2 text-xs text-muted-foreground">
          Preview build — no payment was taken and no order was created. Add a
          Stripe secret key to enable real checkout.
        </p>
      )}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/account/orders">View orders</Link>
        </Button>
      </div>
    </div>
  );
}
