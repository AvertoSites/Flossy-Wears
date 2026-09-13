import { CheckIcon, TruckIcon } from "lucide-react";
import { site } from "@/lib/data/site";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const threshold = site.freeShippingThreshold;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  const qualified = remaining === 0;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-sm">
        {qualified ? (
          <>
            <CheckIcon className="size-4 text-gold-dark" />
            <span>You&rsquo;ve unlocked free UK delivery</span>
          </>
        ) : (
          <>
            <TruckIcon className="size-4 text-muted-foreground" />
            <span>
              Add <strong>{formatPrice(remaining)}</strong> more for free UK delivery
            </span>
          </>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-cream">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            qualified ? "bg-gold-dark" : "bg-gold",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
