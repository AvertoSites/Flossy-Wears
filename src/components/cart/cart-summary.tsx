import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Row = { label: string; value: string; muted?: boolean; strong?: boolean };

export function CartSummary({
  subtotal,
  shipping,
  discount = 0,
  discountLabel,
  showShipping = true,
  className,
}: {
  subtotal: number;
  shipping?: number;
  discount?: number;
  discountLabel?: string;
  showShipping?: boolean;
  className?: string;
}) {
  const total = Math.max(0, subtotal - discount) + (shipping ?? 0);

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

  return (
    <div className={cn("flex flex-col gap-2 text-sm", className)}>
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
      <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-medium">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
      <p className="text-xs text-muted-foreground">VAT included where applicable.</p>
    </div>
  );
}
