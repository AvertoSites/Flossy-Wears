import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingStarsProps = {
  value: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  count?: number;
};

export function RatingStars({
  value,
  size = 16,
  className,
  showValue = false,
  count,
}: RatingStarsProps) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="inline-flex"
        role="img"
        aria-label={`Rated ${value.toFixed(1)} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
          return (
            <span key={i} className="relative" style={{ width: size, height: size }}>
              <StarIcon
                className="absolute inset-0 text-gold/40"
                style={{ width: size, height: size }}
              />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <StarIcon
                    className="text-gold fill-gold"
                    style={{ width: size, height: size }}
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="text-sm text-muted-foreground">
          {value.toFixed(1)}
          {typeof count === "number" && ` (${count})`}
        </span>
      )}
    </span>
  );
}
