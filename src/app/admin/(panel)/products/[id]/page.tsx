"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, Card } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/admin/product-form";

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isPending } = useQuery({
    queryKey: ["admin", "product", params.id],
    queryFn: () => adminApi.product(params.id),
  });

  if (isPending) {
    return (
      <>
        <AdminHeader title="Product" backHref="/admin/products" backLabel="Products" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </>
    );
  }
  if (!data?.product) {
    return (
      <>
        <AdminHeader
          title="Product not found"
          backHref="/admin/products"
          backLabel="Products"
        />
        <Card>This product doesn&rsquo;t exist.</Card>
      </>
    );
  }

  return <ProductForm key={data.product.id} product={data.product} />;
}
