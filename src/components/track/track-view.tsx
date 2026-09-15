"use client";

import { useState } from "react";
import Image from "next/image";
import { PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { OrderStatusBadge } from "@/components/common/order-status-badge";
import { DeliveryProgress } from "@/components/common/delivery-progress";
import { formatDate } from "@/lib/format";
import type { OrderEvent, OrderStatus } from "@/types";

type TrackResult = {
  number: string;
  status: OrderStatus;
  placedAt: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  lines: { name: string; colourLabel: string; size: string; quantity: number; image: string }[];
  timeline: OrderEvent[];
};

export function TrackView({ initialOrder = "" }: { initialOrder?: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data as TrackResult);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[380px_1fr]">
      <form
        onSubmit={onSubmit}
        className="flex h-fit flex-col gap-4 rounded-xl border border-border bg-card p-6"
      >
        <div>
          <h2 className="text-lg font-medium">Track your order</h2>
          <p className="text-sm text-muted-foreground">
            Enter the order number from your confirmation email.
          </p>
        </div>
        <TextField
          label="Order number"
          name="orderNumber"
          placeholder="FW-1042"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Checking…" : "Track order"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      <div>
        {!result ? (
          <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            Your tracking details will appear here.
          </div>
        ) : (
          <div className="flex flex-col gap-8 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Order</p>
                <p className="font-display text-2xl">{result.number}</p>
                <p className="text-xs text-muted-foreground">
                  Placed {formatDate(result.placedAt)}
                </p>
              </div>
              <OrderStatusBadge status={result.status} />
            </div>

            <DeliveryProgress
              status={result.status}
              carrier={result.carrier}
              trackingNumber={result.trackingNumber}
              trackingUrl={result.trackingUrl}
              timeline={result.timeline}
            />

            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <PackageIcon className="size-4" />
                {result.lines.reduce((n, l) => n + l.quantity, 0)} item(s)
              </p>
              <ul className="flex flex-col gap-3">
                {result.lines.map((line, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="relative size-14 overflow-hidden rounded-md border border-border bg-cream">
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.colourLabel} · {line.size} · Qty {line.quantity}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
