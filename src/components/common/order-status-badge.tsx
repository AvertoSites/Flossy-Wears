import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/types";

const ORDER_STYLES: Record<OrderStatus, string> = {
  processing: "bg-amber-100 text-amber-900 border-amber-200",
  packed: "bg-sky-100 text-sky-900 border-sky-200",
  shipped: "bg-indigo-100 text-indigo-900 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-900 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-900 border-rose-200",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  paid: "bg-emerald-100 text-emerald-900 border-emerald-200",
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  refunded: "bg-rose-100 text-rose-900 border-rose-200",
  partially_refunded: "bg-orange-100 text-orange-900 border-orange-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", ORDER_STYLES[status])}>
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", PAYMENT_STYLES[status])}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}
