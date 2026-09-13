"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, EmptyRow, TableFrame, Td, Th } from "@/components/admin/ui";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/common/order-status-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);

  const { data, isPending } = useQuery({
    queryKey: ["admin", "orders", { status, q: debouncedQ }],
    queryFn: () => adminApi.orders({ status, q: debouncedQ }),
  });

  const orders = data?.orders ?? [];

  return (
    <>
      <AdminHeader
        title="Orders"
        description="Update fulfillment, add tracking and issue refunds."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                status === f.value
                  ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                  : "border-black/15 bg-white hover:border-[#1e3a5f]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order #, name or email"
            className="bg-white pl-9"
          />
        </div>
      </div>

      <TableFrame>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Date</Th>
            <Th>Customer</Th>
            <Th>Total</Th>
            <Th>Payment</Th>
            <Th>Fulfillment</Th>
          </tr>
        </thead>
        <tbody>
          {isPending ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <Td>
                  <Skeleton className="h-4 w-16" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-20" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-32" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-14" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-16" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-16" />
                </Td>
              </tr>
            ))
          ) : orders.length === 0 ? (
            <EmptyRow colSpan={6} label="No orders match those filters." />
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="hover:bg-[#faf8f2]">
                <Td>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-[#1e3a5f] hover:underline"
                  >
                    {order.number}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-muted-foreground">
                  {formatDate(order.placedAt)}
                </Td>
                <Td>
                  <span className="block">{order.customerName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {order.customerEmail}
                  </span>
                </Td>
                <Td className="tabular-nums">{formatPrice(order.total)}</Td>
                <Td>
                  <PaymentStatusBadge status={order.paymentStatus ?? "paid"} />
                </Td>
                <Td>
                  <OrderStatusBadge status={order.status} />
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableFrame>
    </>
  );
}
