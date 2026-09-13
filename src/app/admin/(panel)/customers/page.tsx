"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, EmptyRow, TableFrame, Td, Th } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";

export default function AdminCustomersPage() {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: adminApi.customers,
  });
  const customers = data?.customers ?? [];

  return (
    <>
      <AdminHeader
        title="Customers"
        description="Everyone who has placed an order, by lifetime value."
      />
      <TableFrame>
        <thead>
          <tr>
            <Th>Customer</Th>
            <Th>Orders</Th>
            <Th>Spent</Th>
            <Th>Last order</Th>
          </tr>
        </thead>
        <tbody>
          {isPending ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <Td colSpan={4}>
                  <Skeleton className="h-4 w-full" />
                </Td>
              </tr>
            ))
          ) : customers.length === 0 ? (
            <EmptyRow colSpan={4} label="No customers yet." />
          ) : (
            customers.map((c) => (
              <tr key={c.email} className="hover:bg-[#faf8f2]">
                <Td>
                  <Link
                    href={`/admin/customers/${encodeURIComponent(c.email)}`}
                    className="font-medium text-[#1e3a5f] hover:underline"
                  >
                    {c.firstName} {c.lastName}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    {c.email}
                  </span>
                </Td>
                <Td className="tabular-nums">{c.orderCount}</Td>
                <Td className="tabular-nums">{formatPrice(c.totalSpent ?? 0)}</Td>
                <Td className="text-muted-foreground">
                  {c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableFrame>
    </>
  );
}
