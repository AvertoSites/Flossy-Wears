"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, Card, StatCard } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/common/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";

export default function AdminCustomerDetailPage() {
  const params = useParams<{ email: string }>();
  const email = decodeURIComponent(params.email);

  const { data, isPending } = useQuery({
    queryKey: ["admin", "customer", email],
    queryFn: () => adminApi.customer(email),
  });

  if (isPending) {
    return (
      <>
        <AdminHeader title="Customer" backHref="/admin/customers" backLabel="Customers" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </>
    );
  }
  if (!data) {
    return (
      <>
        <AdminHeader
          title="Customer not found"
          backHref="/admin/customers"
          backLabel="Customers"
        />
        <Card>No customer with that email.</Card>
      </>
    );
  }

  const { customer, orders } = data;

  return (
    <>
      <AdminHeader
        title={`${customer.firstName} ${customer.lastName}`}
        description={customer.email}
        backHref="/admin/customers"
        backLabel="Customers"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={String(customer.orderCount ?? 0)} />
        <StatCard
          label="Lifetime value"
          value={formatPrice(customer.totalSpent ?? 0)}
        />
        <StatCard
          label="Last order"
          value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
        />
      </div>

      <Card title="Order history">
        <ul className="flex flex-col divide-y divide-black/5">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-3 py-3 text-sm hover:text-[#1e3a5f]"
              >
                <span className="font-medium">{order.number}</span>
                <span className="flex-1 text-muted-foreground">
                  {formatDate(order.placedAt)}
                </span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
                <OrderStatusBadge status={order.status} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
