"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { CircleCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firestore } from "@/lib/firebase/client";
import { confirmCheckoutSession } from "@/lib/firebase/functions";
import { useCart } from "@/lib/store/cart";
import type { Order } from "@/types";
import { collectionPointFor, isCollectionOrder } from "@/lib/delivery";

export function CheckoutSuccessView() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const clear = useCart((s) => s.clear);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    clear();
  }, [clear]);

  useEffect(() => {
    if (!sessionId) return;
    // Immediate fulfillment attempt (Stripe's recommended landing-page
    // trigger) — harmless if the webhook already ran.
    confirmCheckoutSession(sessionId).catch(() => {});
    const unsubscribe = onSnapshot(doc(firestore, "orders", sessionId), (snap) => {
      if (snap.exists()) setOrder(snap.data() as Order);
    });
    return unsubscribe;
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="container-page flex flex-col items-center gap-6 py-24 text-center">
        <p className="text-muted-foreground">No checkout session found.</p>
        <Button asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const confirmed = order?.paymentStatus === "paid";
  const point = order && isCollectionOrder(order) ? collectionPointFor(order) : null;

  return (
    <div className="container-page flex flex-col items-center gap-6 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-cream text-gold-dark">
        <CircleCheckIcon className="size-8" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl">
          {confirmed ? "Thank you — your order is confirmed" : "Confirming your payment…"}
        </h1>
        <p className="text-muted-foreground">
          {confirmed ? (
            <>
              Order <span className="font-medium text-foreground">{order.number}</span>. A
              confirmation email is on its way.{" "}
              {point
                ? "We’ll email you when it’s ready to collect."
                : "We’ll let you know when it ships."}
            </>
          ) : (
            "This usually takes a few seconds — hang tight."
          )}
        </p>
      </div>
      {confirmed && point && (
        <div className="max-w-md rounded-xl border border-navy/30 bg-cream/60 p-5 text-left text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery method</p>
          <p className="mb-2 font-semibold">Collect from store</p>
          <p className="font-medium">{point.address}</p>
          <p className="text-muted-foreground">Collection hours: {point.hours}</p>
          <p className="mt-2 text-muted-foreground">{point.instructions}</p>
        </div>
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
