"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckIcon, PackageIcon, TruckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { OrderStatusBadge } from "@/components/common/order-status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "processing", label: "Order placed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

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

  const activeStep = result
    ? Math.max(
        0,
        STEPS.findIndex((s) => s.key === result.status),
      )
    : 0;
  const cancelled = result?.status === "cancelled";

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
        <p className="rounded-md border border-dashed border-border bg-cream/50 px-3 py-2 text-xs text-muted-foreground">
          Demo: try <strong>FW-1200</strong> with <strong>james.w@example.com</strong>,
          or any order from the admin panel.
        </p>
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

            {!cancelled && (
              <div className="flex items-center">
                {STEPS.map((step, i) => {
                  const done = i <= activeStep;
                  return (
                    <div key={step.key} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={cn(
                            "grid size-8 place-items-center rounded-full border text-xs",
                            done
                              ? "border-navy bg-navy text-primary-foreground"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {done ? <CheckIcon className="size-4" /> : i + 1}
                        </span>
                        <span
                          className={cn(
                            "text-[0.7rem]",
                            done ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={cn(
                            "mx-2 h-0.5 flex-1",
                            i < activeStep ? "bg-navy" : "bg-border",
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {result.trackingNumber && (
              <div className="flex flex-col gap-2 rounded-lg bg-cream/60 p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <TruckIcon className="size-4" />
                  {result.carrier} · {result.trackingNumber}
                </p>
                {result.trackingUrl && (
                  <a
                    href={result.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-navy underline underline-offset-4"
                  >
                    Track with carrier
                  </a>
                )}
              </div>
            )}

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

            {result.timeline.length > 0 && (
              <ol className="flex flex-col gap-3 border-t border-border pt-5">
                {[...result.timeline].reverse().map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                    <div>
                      <p>{event.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.at)}
                        {event.detail ? ` · ${event.detail}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
