"use client";

import Link from "next/link";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { useCustomerOrder } from "@/lib/firebase/orders";
import { Badge } from "@/components/ui/badge";
import { CartSummary } from "@/components/cart/cart-summary";
import { DeliveryProgress } from "@/components/common/delivery-progress";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const uid = useAuth((s) => s.user?.uid);
  const { data: order, isPending } = useCustomerOrder(uid, id);

  if (isPending) return null;
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium">{order.number}</h2>
          <p className="text-sm text-muted-foreground">
            Placed {formatDate(order.placedAt)}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {order.status}
        </Badge>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <DeliveryProgress
          status={order.status}
          carrier={order.carrier}
          trackingNumber={order.trackingNumber}
          trackingUrl={order.trackingUrl}
          timeline={order.timeline}
        />
      </div>

      <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
        {order.lines.map((line, i) => (
          <div key={i} className="flex gap-4 p-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border bg-cream">
              <Image
                src={line.image}
                alt={line.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col text-sm">
              <p className="font-medium">{line.name}</p>
              <p className="text-xs text-muted-foreground">
                {line.colourLabel} · {line.size} · Qty {line.quantity}
              </p>
              <span className="mt-auto">{formatPrice(line.price * line.quantity)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 text-sm">
          <p className="mb-2 font-medium">Delivery address</p>
          <address className="not-italic text-muted-foreground">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            <br />
            {order.shippingAddress.line1}
            <br />
            {order.shippingAddress.line2 && (
              <>
                {order.shippingAddress.line2}
                <br />
              </>
            )}
            {order.shippingAddress.city}, {order.shippingAddress.postcode}
            <br />
            {order.shippingAddress.country}
          </address>
          <p className="mt-3 text-muted-foreground">{order.shippingMethod}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <CartSummary
            subtotal={order.subtotal}
            shipping={order.shipping}
            discount={order.discount}
          />
        </div>
      </div>
    </div>
  );
}
