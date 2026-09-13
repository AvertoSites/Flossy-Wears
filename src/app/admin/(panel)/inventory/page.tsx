"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, EmptyRow, TableFrame, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { COLOURS } from "@/lib/constants";

export default function AdminInventoryPage() {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: adminApi.inventory,
  });
  const rows = data?.rows ?? [];

  return (
    <>
      <AdminHeader
        title="Inventory"
        description="Variants at or below 4 units. Edit stock on the product page."
      />
      <TableFrame>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Colour</Th>
            <Th>Size</Th>
            <Th>Stock</Th>
            <Th />
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
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={5} label="Everything is well stocked. 🎉" />
          ) : (
            rows.map((row) => (
              <tr key={row.variantId} className="hover:bg-[#faf8f2]">
                <Td className="font-medium">{row.name}</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-3 rounded-full border border-black/10"
                      style={{ backgroundColor: COLOURS[row.colour]?.hex }}
                    />
                    {COLOURS[row.colour]?.label ?? row.colour}
                  </span>
                </Td>
                <Td>{row.size}</Td>
                <Td>
                  {row.stock === 0 ? (
                    <Badge variant="outline" className="bg-rose-100 text-rose-900">
                      Sold out
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-900"
                    >
                      {row.stock} left
                    </Badge>
                  )}
                </Td>
                <Td>
                  <Link
                    href={`/admin/products/${row.productId}`}
                    className="text-sm text-[#1e3a5f] hover:underline"
                  >
                    Restock →
                  </Link>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableFrame>
    </>
  );
}
