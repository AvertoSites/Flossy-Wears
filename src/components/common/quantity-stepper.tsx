"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantityStepperProps) {
  const dim = size === "sm" ? "size-7" : "size-9";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-input bg-card",
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          dim,
          "grid place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40",
        )}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <MinusIcon className="size-3.5" />
      </button>
      <span
        className={cn(
          "min-w-8 text-center text-sm tabular-nums",
          size === "sm" && "min-w-6",
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(
          dim,
          "grid place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40",
        )}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  );
}
