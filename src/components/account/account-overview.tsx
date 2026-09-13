"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/store/auth";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order } from "@/types";

export function AccountOverview({
  recentOrder,
  orderCount,
}: {
  recentOrder: Order | null;
  orderCount: number;
}) {
  const user = useAuth((s) => s.user);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="text-lg font-medium">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent order</h2>
          <Link
            href="/account/orders"
            className="text-sm text-navy underline-offset-4 hover:underline"
          >
            All orders ({orderCount})
          </Link>
        </div>
        {recentOrder ? (
          <Link
            href={`/account/orders/${recentOrder.id}`}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-navy"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{recentOrder.number}</span>
              <Badge variant="outline" className="capitalize">
                {recentOrder.status}
              </Badge>
            </div>
            <div className="flex gap-2">
              {recentOrder.lines.map((line, i) => (
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
            <p className="text-xs text-muted-foreground">
              Placed {formatDate(recentOrder.placedAt)} ·{" "}
              {formatPrice(recentOrder.total)}
            </p>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        )}
      </section>
    </div>
  );
}
