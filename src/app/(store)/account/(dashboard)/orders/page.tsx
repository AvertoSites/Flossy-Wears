import Link from "next/link";
import Image from "next/image";
import { getOrders } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate, formatPrice, pluralise } from "@/lib/format";

export default async function OrdersPage() {
  const orders = await getOrders();

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place an order it'll show up here."
        action={{ label: "Shop the line", href: "/shop" }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Order history</h2>
      {orders.map((order) => {
        const itemCount = order.lines.reduce((n, l) => n + l.quantity, 0);
        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-navy"
          >
            <div className="flex -space-x-3">
              {order.lines.slice(0, 3).map((line, i) => (
                <div
                  key={i}
                  className="relative size-14 overflow-hidden rounded-md border border-border bg-cream"
                >
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{order.number}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.placedAt)} · {itemCount}{" "}
                {pluralise(itemCount, "item")} · {formatPrice(order.total)}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {order.status}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
