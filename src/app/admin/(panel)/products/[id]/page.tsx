"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLinkIcon } from "lucide-react";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { COLOURS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { Product, ProductBadge } from "@/types";

const BADGES: ProductBadge[] = ["new", "bestseller", "restock", "sale"];

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

  return <ProductEditor key={data.product.id} product={data.product} />;
}

function ProductEditor({ product }: { product: Product }) {
  const qc = useQueryClient();
  const [price, setPrice] = useState((product.price.amount / 100).toString());
  const [compareAt, setCompareAt] = useState(
    product.compareAtPrice ? (product.compareAtPrice.amount / 100).toString() : "",
  );
  const [active, setActive] = useState(product.active !== false);
  const [badges, setBadges] = useState<ProductBadge[]>(product.badges);
  const [stock, setStock] = useState<Record<string, number>>(
    Object.fromEntries(product.variants.map((v) => [v.id, v.stock])),
  );

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateProduct(product.id, {
        price: Math.round(parseFloat(price || "0") * 100),
        compareAtPrice: compareAt ? Math.round(parseFloat(compareAt) * 100) : null,
        active,
        badges,
        variantStock: stock,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "product", product.id] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
      toast.success("Product updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byColour = product.colours.map((c) => ({
    colour: c,
    variants: product.variants.filter((v) => v.colour === c.value),
  }));

  return (
    <>
      <AdminHeader
        title={product.name}
        description={`${product.verse.text} — ${product.verse.reference}`}
        backHref="/admin/products"
        backLabel="Products"
        actions={
          <>
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-[#1e3a5f] hover:underline"
            >
              View on store <ExternalLinkIcon className="size-3" />
            </Link>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price">Price (£)</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="compare">Compare-at price (£)</Label>
                <Input
                  id="compare"
                  inputMode="decimal"
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                  placeholder="Leave blank for none"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Applies to every variant of this product.
            </p>
          </Card>

          <Card title="Inventory by variant">
            <div className="flex flex-col gap-5">
              {byColour.map(({ colour, variants }) => (
                <div key={colour.value}>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <span
                      className="size-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: COLOURS[colour.value]?.hex }}
                    />
                    {colour.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {variants.map((v) => (
                      <label key={v.id} className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {v.size.toUpperCase()}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={stock[v.id] ?? 0}
                          onChange={(e) =>
                            setStock((s) => ({
                              ...s,
                              [v.id]: Math.max(0, Number(e.target.value)),
                            }))
                          }
                          className="h-9 px-2"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-lg border border-black/10 bg-[#f1eadb]">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Current price: {formatPrice(product.price.amount)}
            </p>
          </Card>

          <Card title="Visibility">
            <label className="flex items-center justify-between text-sm">
              <span>Show on storefront</span>
              <Checkbox
                checked={active}
                onCheckedChange={(c) => setActive(!!c)}
              />
            </label>
          </Card>

          <Card title="Badges">
            <div className="flex flex-col gap-2">
              {BADGES.map((b) => (
                <label key={b} className="flex items-center gap-2 text-sm capitalize">
                  <Checkbox
                    checked={badges.includes(b)}
                    onCheckedChange={(checked) =>
                      setBadges((prev) =>
                        checked ? [...prev, b] : prev.filter((x) => x !== b),
                      )
                    }
                  />
                  {b}
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
