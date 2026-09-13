"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, EmptyRow, TableFrame, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: adminApi.products,
  });
  const products = data?.products ?? [];

  return (
    <>
      <AdminHeader
        title="Products"
        description="Edit price, stock, badges and visibility."
      />
      <TableFrame>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>Badges</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {isPending ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <Td>
                  <Skeleton className="h-10 w-48" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-14" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-10" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-20" />
                </Td>
                <Td>
                  <Skeleton className="h-4 w-14" />
                </Td>
              </tr>
            ))
          ) : products.length === 0 ? (
            <EmptyRow colSpan={5} label="No products." />
          ) : (
            products.map((p) => {
              const stock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="hover:bg-[#faf8f2]">
                  <Td>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-md border border-black/10 bg-[#f1eadb]">
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </span>
                      <span>
                        <span className="block font-medium text-[#1e3a5f]">
                          {p.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {p.verse.reference}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="tabular-nums">
                    {formatPrice(p.price.amount)}
                    {p.compareAtPrice && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        {formatPrice(p.compareAtPrice.amount)}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        "tabular-nums",
                        stock < 20 && "text-amber-700",
                        stock === 0 && "text-rose-700",
                      )}
                    >
                      {stock}
                    </span>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap gap-1">
                      {p.badges.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        p.badges.map((b) => (
                          <Badge key={b} variant="outline" className="capitalize">
                            {b}
                          </Badge>
                        ))
                      )}
                    </span>
                  </Td>
                  <Td>
                    {p.active === false ? (
                      <Badge variant="outline" className="bg-rose-100 text-rose-900">
                        Hidden
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-emerald-100 text-emerald-900"
                      >
                        Live
                      </Badge>
                    )}
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableFrame>
    </>
  );
}
