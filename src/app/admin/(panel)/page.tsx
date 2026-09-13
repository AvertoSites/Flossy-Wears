"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, Card, StatCard } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/common/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";

export default function AdminDashboardPage() {
  const summary = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: adminApi.summary,
  });
  const orders = useQuery({
    queryKey: ["admin", "orders", { status: "all" }],
    queryFn: () => adminApi.orders(),
  });

  const s = summary.data;
  const recent = orders.data?.orders.slice(0, 6) ?? [];
  const maxDay = Math.max(1, ...(s?.revenueByDay.map((d) => d.total) ?? [1]));

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="Last 14 days · store performance at a glance"
      />

      {!s ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue"
            value={formatPrice(s.revenue)}
            sub={`${s.orderCount} orders`}
          />
          <StatCard
            label="Avg order value"
            value={formatPrice(s.averageOrderValue)}
            sub={`${s.unitsSold} units sold`}
          />
          <StatCard
            label="Awaiting fulfillment"
            value={String(s.awaitingFulfillment)}
            sub="processing or packed"
          />
          <StatCard
            label="Refunded"
            value={formatPrice(s.refundedAmount)}
            sub={`${s.lowStockCount} low-stock variants`}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Revenue by day">
          {!s ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="flex h-40 items-end gap-1.5">
              {s.revenueByDay.map((day) => (
                <div
                  key={day.date}
                  className="group flex flex-1 flex-col items-center justify-end gap-1"
                  title={`${day.date}: ${formatPrice(day.total)}`}
                >
                  <div
                    className="w-full rounded-t bg-[#c8a44d] transition-colors group-hover:bg-[#9a7b2e]"
                    style={{
                      height: `${Math.max(3, (day.total / maxDay) * 100)}%`,
                    }}
                  />
                  <span className="text-[0.6rem] text-muted-foreground">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Orders by status">
          {!s ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <ul className="flex flex-col gap-2">
              {s.statusBreakdown.map((row) => (
                <li
                  key={row.status}
                  className="flex items-center justify-between text-sm"
                >
                  <OrderStatusBadge status={row.status} />
                  <span className="tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6" title="Recent orders">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-black/5">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-3 py-3 text-sm hover:text-[#1e3a5f]"
                >
                  <span className="font-medium">{order.number}</span>
                  <span className="flex-1 truncate text-muted-foreground">
                    {order.customerName}
                  </span>
                  <span className="tabular-nums">{formatPrice(order.total)}</span>
                  <OrderStatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/admin/orders"
          className="mt-3 inline-block text-sm text-[#1e3a5f] underline-offset-4 hover:underline"
        >
          All orders →
        </Link>
      </Card>
    </>
  );
}
