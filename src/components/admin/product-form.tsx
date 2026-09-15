"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { doc, collection } from "firebase/firestore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin/client";
import { firestore } from "@/lib/firebase/client";
import { useCollectionsList } from "@/lib/queries/use-collections";
import { AdminHeader, Card } from "@/components/admin/ui";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLOURS, DEFAULT_GARMENT_WEIGHT_GRAMS, SIZES } from "@/lib/constants";
import { slugify } from "@/lib/format";
import type { ColourOption, Product, ProductBadge, ProductCategory, ProductType } from "@/types";

const TYPES: ProductType[] = ["sweatshirt", "t-shirt", "hoodie"];
const CATEGORIES: ProductCategory[] = ["men", "women", "unisex"];
const BADGES: ProductBadge[] = ["new", "bestseller", "restock", "sale"];
const COLOUR_OPTIONS = Object.values(COLOURS);

function variantKey(colour: string, size: string) {
  return `${colour}:${size}`;
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isEdit = !!product;
  const { data: collections = [] } = useCollectionsList();

  const [productId] = useState(
    () => product?.id ?? doc(collection(firestore, "products")).id,
  );
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [verseText, setVerseText] = useState(product?.verse.text ?? "");
  const [verseReference, setVerseReference] = useState(product?.verse.reference ?? "");
  const [type, setType] = useState<ProductType>(product?.type ?? "sweatshirt");
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "unisex");
  const [collectionSlugs, setCollectionSlugs] = useState<string[]>(
    product?.collectionSlugs ?? [],
  );
  const [price, setPrice] = useState(
    product ? (product.price.amount / 100).toString() : "",
  );
  const [compareAt, setCompareAt] = useState(
    product?.compareAtPrice ? (product.compareAtPrice.amount / 100).toString() : "",
  );
  const [colourValues, setColourValues] = useState<string[]>(
    (product?.colours ?? [])
      .map((c) => c.value)
      .filter((v) => COLOUR_OPTIONS.some((o) => o.value === v)),
  );
  const [customColours, setCustomColours] = useState<ColourOption[]>(
    (product?.colours ?? []).filter((c) => !COLOUR_OPTIONS.some((o) => o.value === c.value)),
  );
  const [newColourLabel, setNewColourLabel] = useState("");
  const [newColourHex, setNewColourHex] = useState("#4b5320");
  const [sizeValues, setSizeValues] = useState<string[]>(
    product?.sizes.map((s) => s.value) ?? [],
  );
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [badges, setBadges] = useState<ProductBadge[]>(product?.badges ?? []);
  const [fabric, setFabric] = useState(product?.fabric ?? "");
  const [care, setCare] = useState((product?.care ?? []).join(", "));
  const [fit, setFit] = useState(product?.fit ?? "");
  const [weightGrams, setWeightGrams] = useState(
    (product?.weightGrams ?? DEFAULT_GARMENT_WEIGHT_GRAMS).toString(),
  );
  const [active, setActive] = useState(product?.active !== false);
  const [customizable, setCustomizable] = useState(!!product?.customizable);
  const [stockByKey, setStockByKey] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const v of product?.variants ?? []) {
      initial[variantKey(v.colour, v.size)] = v.stock;
    }
    return initial;
  });

  function onNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  const selectedColours = [
    ...COLOUR_OPTIONS.filter((c) => colourValues.includes(c.value)),
    ...customColours,
  ];
  const selectedSizes = SIZES.filter((s) => sizeValues.includes(s.value));

  function addCustomColour() {
    const label = newColourLabel.trim();
    if (!label) return;
    const value = slugify(label);
    if (selectedColours.some((c) => c.value === value)) return;
    setCustomColours((prev) => [...prev, { value, label, hex: newColourHex }]);
    setNewColourLabel("");
  }

  const body = {
    id: productId,
    slug,
    name,
    tagline,
    description,
    verse: { text: verseText, reference: verseReference },
    type,
    category,
    collectionSlugs,
    price: Math.round(parseFloat(price || "0") * 100),
    compareAtPrice: compareAt ? Math.round(parseFloat(compareAt) * 100) : null,
    colours: selectedColours,
    sizes: selectedSizes,
    images,
    badges,
    fabric,
    care: care
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    fit,
    weightGrams: Math.max(0, Math.round(parseFloat(weightGrams || "0"))),
    active,
    customizable,
    stockByKey,
  };

  const save = useMutation({
    mutationFn: () =>
      isEdit ? adminApi.updateProduct(product.id, body) : adminApi.createProduct(body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
      toast.success(isEdit ? "Product updated" : "Product created");
      if (!isEdit) router.push(`/admin/products/${res.product.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteProduct = useMutation({
    mutationFn: () => adminApi.deleteProduct(product!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
      toast.success("Product deleted");
      router.push("/admin/products");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave = name.trim() && slug.trim() && price.trim() && images.length > 0;

  return (
    <>
      <AdminHeader
        title={isEdit ? product.name : "New product"}
        backHref="/admin/products"
        backLabel="Products"
        actions={
          <>
            {isEdit && (
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
            <Button onClick={() => save.mutate()} disabled={!canSave || save.isPending}>
              {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card title="Basics">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => onNameChange(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(slugify(e.target.value));
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="verseText">Verse text</Label>
                  <Input
                    id="verseText"
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="verseRef">Verse reference</Label>
                  <Input
                    id="verseRef"
                    value={verseReference}
                    onChange={(e) => setVerseReference(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as ProductType)}>
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
                    <SelectTrigger className="capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Photos">
            <ImageUploader productId={productId} images={images} onChange={setImages} />
          </Card>

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
          </Card>

          <Card title="Colours & sizes">
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">Colours</p>
                <div className="flex flex-wrap gap-3">
                  {COLOUR_OPTIONS.map((c) => (
                    <label key={c.value} className="flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={colourValues.includes(c.value)}
                        onCheckedChange={(checked) =>
                          setColourValues((prev) =>
                            checked ? [...prev, c.value] : prev.filter((v) => v !== c.value),
                          )
                        }
                      />
                      <span
                        className="size-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
                {customColours.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {customColours.map((c) => (
                      <span
                        key={c.value}
                        className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white py-1 pl-1 pr-2 text-xs"
                      >
                        <span
                          className="size-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.label}
                        <button
                          type="button"
                          onClick={() =>
                            setCustomColours((prev) => prev.filter((x) => x.value !== c.value))
                          }
                          aria-label={`Remove ${c.label}`}
                          className="text-muted-foreground hover:text-rose-600"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-end gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="new-colour-swatch" className="text-xs">
                      Custom colour
                    </Label>
                    <input
                      id="new-colour-swatch"
                      type="color"
                      value={newColourHex}
                      onChange={(e) => setNewColourHex(e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded-md border border-input p-1"
                    />
                  </div>
                  <Input
                    placeholder="Colour name, e.g. Sage Green"
                    value={newColourLabel}
                    onChange={(e) => setNewColourLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomColour();
                      }
                    }}
                    className="max-w-56"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomColour}>
                    Add colour
                  </Button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Sizes</p>
                <div className="flex flex-wrap gap-3">
                  {SIZES.map((s) => (
                    <label key={s.value} className="flex items-center gap-1.5 text-sm">
                      <Checkbox
                        checked={sizeValues.includes(s.value)}
                        onCheckedChange={(checked) =>
                          setSizeValues((prev) =>
                            checked ? [...prev, s.value] : prev.filter((v) => v !== s.value),
                          )
                        }
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {selectedColours.length > 0 && selectedSizes.length > 0 && (
            <Card title="Stock by variant">
              <div className="flex flex-col gap-5">
                {selectedColours.map((colour) => (
                  <div key={colour.value}>
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <span
                        className="size-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: colour.hex }}
                      />
                      {colour.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {selectedSizes.map((size) => {
                        const key = variantKey(colour.value, size.value);
                        return (
                          <label key={key} className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">{size.label}</span>
                            <Input
                              type="number"
                              min={0}
                              value={stockByKey[key] ?? 0}
                              onChange={(e) =>
                                setStockByKey((s) => ({
                                  ...s,
                                  [key]: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="h-9 px-2"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Details">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fabric">Fabric</Label>
                <Input id="fabric" value={fabric} onChange={(e) => setFabric(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="care">Care instructions (comma-separated)</Label>
                <Input id="care" value={care} onChange={(e) => setCare(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fit">Fit</Label>
                <Input id="fit" value={fit} onChange={(e) => setFit(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="weight">Shipping weight (g)</Label>
                <Input
                  id="weight"
                  inputMode="numeric"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Packed weight — used to price Royal Mail delivery at checkout.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Collections">
            <div className="flex flex-col gap-2">
              {collections.map((c) => (
                <label key={c.slug} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={collectionSlugs.includes(c.slug)}
                    onCheckedChange={(checked) =>
                      setCollectionSlugs((prev) =>
                        checked ? [...prev, c.slug] : prev.filter((s) => s !== c.slug),
                      )
                    }
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </Card>

          <Card title="Visibility">
            <label className="flex items-center justify-between text-sm">
              <span>Show on storefront</span>
              <Checkbox checked={active} onCheckedChange={(c) => setActive(!!c)} />
            </label>
            <label className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-sm">
              <span>
                Available on &ldquo;Customise Your Own&rdquo;
                <span className="block text-xs text-muted-foreground">
                  Shoppers can pick this design and swap in their own verse.
                </span>
              </span>
              <Checkbox checked={customizable} onCheckedChange={(c) => setCustomizable(!!c)} />
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

      {isEdit && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={`Delete ${product.name}?`}
          description="This removes the product and its photos permanently. Past orders that included it aren't affected — they keep their own copy of the line details."
          confirmLabel="Delete product"
          destructive
          onConfirm={async () => {
            await deleteProduct.mutateAsync();
          }}
        />
      )}
    </>
  );
}
