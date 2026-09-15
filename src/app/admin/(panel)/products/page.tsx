"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, EmptyRow, TableFrame, Td, Th } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: adminApi.products,
  });
  const products = data?.products ?? [];
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
      toast.success("Product deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <AdminHeader
        title="Products"
        description="Create products and edit price, stock, badges and visibility."
        actions={
          <Button asChild>
            <Link href="/admin/products/new">New product</Link>
          </Button>
        }
      />
      <TableFrame>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>Badges</Th>
            <Th>Status</Th>
            <Th />
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
                <Td>
                  <Skeleton className="h-4 w-4" />
                </Td>
              </tr>
            ))
          ) : products.length === 0 ? (
            <EmptyRow colSpan={6} label="No products." />
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
                  <Td>
                    <button
                      type="button"
                      onClick={() => setToDelete({ id: p.id, name: p.name })}
                      className="text-muted-foreground transition-colors hover:text-rose-600"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableFrame>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="This removes the product and its photos permanently. Past orders that included it aren't affected."
        confirmLabel="Delete product"
        destructive
        onConfirm={async () => {
          if (toDelete) await remove.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
}
