import { TAX_RATE, taxFor } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = { label: string; value: string; muted?: boolean; strong?: boolean };

export function CartSummary({
  subtotal,
  shipping,
  discount = 0,
  discountLabel,
  tax,
  showShipping = true,
  className,
}: {
  subtotal: number;
  shipping?: number;
  discount?: number;
  discountLabel?: string;
  /** Pence. Pass a placed order's stored tax; omitted, it's previewed from the discounted subtotal. */
  tax?: number;
  showShipping?: boolean;
  className?: string;
}) {
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxPence = tax ?? taxFor(discountedSubtotal);
  const total = discountedSubtotal + (shipping ?? 0) + taxPence;

  const rows: Row[] = [
    { label: "Subtotal", value: formatPrice(subtotal) },
  ];
  if (discount > 0) {
    rows.push({
      label: discountLabel ? `Discount (${discountLabel})` : "Discount",
      value: `−${formatPrice(discount)}`,
    });
  }
  if (showShipping) {
    rows.push({
      label: "Delivery",
      value:
        shipping === undefined
          ? "Calculated at checkout"
          : shipping === 0
            ? "Free"
            : formatPrice(shipping),
      muted: shipping === undefined,
    });
  }
  if (taxPence > 0) {
    rows.push({ label: `Tax (${TAX_RATE * 100}%)`, value: formatPrice(taxPence) });
  }

  return (
    <div className={cn("flex flex-col gap-2 text-base sm:text-sm", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between">
          <span className={cn(row.muted && "text-muted-foreground")}>
            {row.label}
          </span>
          <span className={cn(row.muted && "text-muted-foreground")}>
            {row.value}
          </span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-border pt-3 text-lg font-medium sm:text-base">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
