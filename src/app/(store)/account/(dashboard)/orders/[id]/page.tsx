"use client";

import Link from "next/link";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { ArrowLeftIcon, StoreIcon, TruckIcon } from "lucide-react";
import { useAuth } from "@/lib/store/auth";
import { useCustomerOrder } from "@/lib/firebase/orders";
import { Badge } from "@/components/ui/badge";
import { CartSummary } from "@/components/cart/cart-summary";
import { DeliveryProgress } from "@/components/common/delivery-progress";
import { formatDate, formatPrice } from "@/lib/format";
import { collectionPointFor, isCollectionOrder, orderStatusLabel } from "@/lib/delivery";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const uid = useAuth((s) => s.user?.uid);
  const { data: order, isPending } = useCustomerOrder(uid, id);

  if (isPending) return null;
  if (!order) notFound();
  const collecting = isCollectionOrder(order);
  const point = collecting ? collectionPointFor(order) : null;
  const address = order.shippingAddress;

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
        <Badge variant="outline">{orderStatusLabel(order.status, collecting)}</Badge>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <DeliveryProgress
          status={order.status}
          carrier={order.carrier}
          trackingNumber={order.trackingNumber}
          trackingUrl={order.trackingUrl}
          timeline={order.timeline}
          collection={point}
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
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Delivery method
          </p>
          <p className="mb-3 flex items-center gap-2 font-semibold">
            {collecting ? <StoreIcon className="size-4" /> : <TruckIcon className="size-4" />}
            {order.shippingMethod}
          </p>
          {point ? (
            <>
              <p className="mb-1 font-medium">Collect from</p>
              <address className="not-italic text-muted-foreground">
                {point.address}
                <br />
                Collection hours: {point.hours}
              </address>
              {order.collectionContact && (
                <p className="mt-3 text-muted-foreground">
                  Collecting: {order.collectionContact.firstName}{" "}
                  {order.collectionContact.lastName} · {order.collectionContact.phone}
                </p>
              )}
            </>
          ) : address ? (
            <>
              <p className="mb-1 font-medium">Delivery address</p>
              <address className="not-italic text-muted-foreground">
                {address.firstName} {address.lastName}
                <br />
                {address.line1}
                <br />
                {address.line2 && (
                  <>
                    {address.line2}
                    <br />
                  </>
                )}
                {address.city}, {address.postcode}
                <br />
                {address.country}
              </address>
            </>
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <CartSummary
            subtotal={order.subtotal}
            shipping={order.shipping}
            discount={order.discount}
            tax={order.tax ?? 0}
          />
        </div>
      </div>
    </div>
  );
}
