"use client";

import { CheckIcon, TruckIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderEvent, OrderStatus } from "@/types";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "processing", label: "Order placed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

/** The delivery-progress stepper + courier link + event timeline — shared by the public /track page and a signed-in customer's own order detail page. */
export function DeliveryProgress({
  status,
  carrier,
  trackingNumber,
  trackingUrl,
  timeline,
}: {
  status: OrderStatus;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  timeline?: OrderEvent[];
}) {
  const activeStep = Math.max(
    0,
    STEPS.findIndex((s) => s.key === status),
  );
  const cancelled = status === "cancelled";

  return (
    <div className="flex flex-col gap-6">
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

      {trackingNumber && (
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
