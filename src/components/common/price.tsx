import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

type PriceProps = {
  /** Amount in pence. */
  value: number;
  compareAt?: number;
  className?: string;
  compact?: boolean;
};

export function Price({ value, compareAt, className, compact }: PriceProps) {
  const onSale = typeof compareAt === "number" && compareAt > value;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn(onSale && "text-destructive")}>
        {formatPrice(value, { compact })}
      </span>
      {onSale && (
        <span className="text-sm text-muted-foreground line-through">
          {formatPrice(compareAt!, { compact })}
        </span>
      )}
    </span>
  );
}
