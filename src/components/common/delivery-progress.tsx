"use client";

import { CheckIcon, StoreIcon, TruckIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CollectionPoint, OrderEvent, OrderStatus } from "@/types";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "processing", label: "Order placed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const COLLECTION_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "processing", label: "Order placed" },
  { key: "packed", label: "Ready for collection" },
  { key: "delivered", label: "Collected" },
];

/** The delivery-progress stepper + courier link + event timeline — shared by the public /track page and a signed-in customer's own order detail page. */
export function DeliveryProgress({
  status,
  carrier,
  trackingNumber,
  trackingUrl,
  timeline,
  collection,
}: {
  status: OrderStatus;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  timeline?: OrderEvent[];
  /** Set for collection orders — swaps the shipping stepper for pickup steps and details. */
  collection?: CollectionPoint | null;
}) {
  const steps = collection ? COLLECTION_STEPS : STEPS;
  const activeStep = Math.max(
    0,
    steps.findIndex((s) => s.key === status),
  );
  const cancelled = status === "cancelled";

  return (
    <div className="flex flex-col gap-6">
      {!cancelled && (
        <div className="flex items-center">
          {steps.map((step, i) => {
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
                {i < steps.length - 1 && (
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

      {collection && !cancelled && status !== "delivered" && (
        <div className="flex gap-3 rounded-lg bg-cream/60 p-4 text-sm">
          <StoreIcon className="mt-0.5 size-4 shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Collect from store — {collection.address}</p>
            <p className="text-muted-foreground">Collection hours: {collection.hours}</p>
            <p className="text-muted-foreground">
              {status === "packed"
                ? "Your order is ready — come and collect it. "
                : "We’ll email you when it’s ready to collect. "}
              {collection.instructions}
            </p>
          </div>
        </div>
      )}

      {!collection && trackingNumber && (
        <div className="flex flex-col gap-2 rounded-lg bg-cream/60 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <TruckIcon className="size-4" />
            {carrier} · {trackingNumber}
          </p>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-navy underline underline-offset-4"
            >
              Track with carrier
            </a>
          )}
        </div>
      )}

      {timeline && timeline.length > 0 && (
        <ol className="flex flex-col gap-3 border-t border-border pt-5">
          {[...timeline].reverse().map((event) => (
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
  );
}
