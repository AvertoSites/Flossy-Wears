"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BanknoteIcon, ExternalLinkIcon } from "lucide-react";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, Card, EmptyRow, StatCard, TableFrame, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";

export default function AdminPaymentsPage() {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: adminApi.payments,
  });

  return (
    <>
      <AdminHeader
        title="Payments"
        description="Stripe balance and every transaction. Refunds are issued from an order."
        actions={
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#1e3a5f] hover:underline"
          >
            Stripe Dashboard <ExternalLinkIcon className="size-3" />
          </a>
        }
      />

      {data && (
        <div
          className={`mb-4 rounded-lg border px-4 py-2 text-sm ${
            data.live
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {data.live
            ? "Connected to Stripe — showing live balance."
            : "No Stripe key configured — balance is estimated from order data. Refunds run in mock mode."}
        </div>
      )}

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Available balance"
            value={formatPrice(data?.balance.available ?? 0)}
            sub="ready to pay out"
          />
          <StatCard
            label="Pending balance"
            value={formatPrice(data?.balance.pending ?? 0)}
            sub="clearing"
          />
        </div>
      )}

      <Card className="mt-6" title="Transactions">
        <TableFrame>
          <thead>
            <tr>
              <Th>Payment</Th>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <Td colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </Td>
                </tr>
              ))
            ) : (data?.payments.length ?? 0) === 0 ? (
              <EmptyRow colSpan={5} label="No payments yet." />
            ) : (
              data!.payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#faf8f2]">
                  <Td className="font-mono text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <BanknoteIcon className="size-3.5" />
                      {p.id.slice(0, 20)}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/orders/ord_${p.orderNumber}`}
                      className="text-[#1e3a5f] hover:underline"
                    >
                      {p.orderNumber}
                    </Link>
                  </Td>
                  <Td>{p.customer}</Td>
                  <Td className="tabular-nums">
                    {formatPrice(p.amount - p.refunded)}
                    {p.refunded > 0 && (
                      <span className="block text-xs text-muted-foreground">
                        −{formatPrice(p.refunded)} refunded
                      </span>
                    )}
                  </Td>
                  <Td>
                    <Badge
                      variant="outline"
                      className={
                        p.status === "succeeded"
                          ? "bg-emerald-100 text-emerald-900 capitalize"
                          : "bg-rose-100 text-rose-900 capitalize"
                      }
                    >
                      {p.status}
                    </Badge>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableFrame>
      </Card>
    </>
  );
}
