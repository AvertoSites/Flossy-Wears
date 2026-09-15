"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon, LockIcon, TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OrderSummary } from "@/components/checkout/order-summary";
import { AddressForm } from "@/components/account/address-form";
import { EmptyCart } from "@/components/cart/empty-cart";
import { useCart } from "@/lib/store/cart";
import { useAuth } from "@/lib/store/auth";
import { useMounted } from "@/lib/hooks/use-mounted";
import { useAddresses, addressesQueryKey } from "@/lib/firebase/addresses";
import { useStoreSettings } from "@/lib/queries/use-store-settings";
import { createCheckoutSession } from "@/lib/firebase/functions";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const STEPS = ["Delivery", "Payment"] as const;

type PromoPreview = { code: string; label: string; discountPence: number };

export function CheckoutView() {
  const mounted = useMounted();
  const queryClient = useQueryClient();
  const uid = useAuth((s) => s.user?.uid);
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const discountCode = useCart((s) => s.discountCode);
  const setDiscountCode = useCart((s) => s.setDiscountCode);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null);

  const { data: addresses = [], isPending: addressesPending } = useAddresses(uid);
  const { data: settings } = useStoreSettings();

  const totalWeightGrams = useCart((s) =>
    s.items.reduce((sum, i) => sum + i.weightGrams * i.quantity, 0),
  );

  const activeAddressId =
    selectedAddressId ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;
  const methods = settings?.shippingMethods ?? [];
  const activeMethodId = shippingMethodId ?? methods[0]?.id ?? null;
  const method = methods.find((m) => m.id === activeMethodId) ?? methods[0];
  const priceForMethod = (m: (typeof methods)[number]) => {
    const sorted = [...m.bands].sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);
    return (sorted.find((b) => totalWeightGrams <= b.maxWeightGrams) ?? sorted.at(-1))?.price ?? 0;
  };
  const shippingCost = method ? priceForMethod(method) : 0;

  // A code applied on the cart page carries over via cart state — re-resolve
  // its label/amount here so the summary shows it instead of looking blank.
  useEffect(() => {
    if (!discountCode || promo?.code === discountCode) return;
    fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: discountCode, subtotalPence: subtotal }),
    })
      .then((res) => (res.ok ? (res.json() as Promise<PromoPreview>) : null))
      .then((data) => data && setPromo(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountCode, subtotal]);

  async function applyPromo() {
    setCheckingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: promoInput, subtotalPence: subtotal }),
      });
      if (!res.ok) {
        setPromo(null);
        setDiscountCode(null);
        setPromoError("That code isn't valid");
        return;
      }
      const data = (await res.json()) as PromoPreview;
      setPromo(data);
      setDiscountCode(data.code);
    } finally {
      setCheckingPromo(false);
    }
  }

  if (!mounted) return null;
  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyCart />
      </div>
    );
  }

  async function onPay() {
    if (!activeAddressId) {
      setError("Add a delivery address to continue.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { url } = await createCheckoutSession({
        lines: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: `${i.name} — ${i.colourLabel} / ${i.size.toUpperCase()}`,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          customVerse: i.customVerse,
        })),
        shippingMethodId: activeMethodId ?? "",
        addressId: activeAddressId,
        discountCode,
      });
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="font-display text-lg text-navy">
          Flossy Wears
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <LockIcon className="size-3.5" />
          Secure checkout
        </span>
      </div>

      <ol className="mb-10 flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full border text-xs",
                i < step && "border-navy bg-navy text-primary-foreground",
                i === step && "border-navy text-navy",
                i > step && "border-border text-muted-foreground",
              )}
            >
              {i < step ? <CheckIcon className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(i === step ? "font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 text-border">/</span>}
          </li>
        ))}
      </ol>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-medium">Delivery address</h2>
                {addressesPending ? null : addresses.length === 0 && !addingAddress ? (
                  <p className="text-sm text-muted-foreground">
                    You don&rsquo;t have a saved address yet.
                  </p>
                ) : (
                  <RadioGroup
                    value={activeAddressId ?? undefined}
                    onValueChange={setSelectedAddressId}
                    className="flex flex-col gap-3"
                  >
                    {addresses.map((address) => (
                      <Label
                        key={address.id}
                        htmlFor={address.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[:checked]:border-navy"
                      >
                        <RadioGroupItem id={address.id} value={address.id} className="mt-1" />
                        <span className="text-sm">
                          <span className="block font-medium">
                            {address.firstName} {address.lastName}
                          </span>
                          <span className="block text-muted-foreground">
                            {address.line1}
                            {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                            {address.postcode}
                          </span>
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                {addingAddress ? (
                  <div className="rounded-lg border border-border p-4">
                    <AddressForm
                      onSaved={(id) => {
                        setAddingAddress(false);
                        setSelectedAddressId(id);
                        queryClient.invalidateQueries({ queryKey: addressesQueryKey(uid) });
                      }}
                      onCancel={() => setAddingAddress(false)}
                    />
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setAddingAddress(true)}>
                    Add a new address
                  </Button>
                )}
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-medium">Delivery method</h2>
                <RadioGroup
                  value={activeMethodId ?? undefined}
                  onValueChange={setShippingMethodId}
                  className="flex flex-col gap-3"
                >
                  {methods.map((m) => {
                    const price = priceForMethod(m);
                    return (
                      <Label
                        key={m.id}
                        htmlFor={m.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 has-[:checked]:border-navy"
                      >
                        <span className="flex items-center gap-3">
                          <RadioGroupItem id={m.id} value={m.id} />
                          <span>
                            <span className="block text-sm font-medium">{m.label}</span>
                            <span className="block text-xs text-muted-foreground">
                              {m.description} · {m.estimate}
                            </span>
                          </span>
                        </span>
                        <span className="text-sm">
                          {price === 0 ? "Free" : formatPrice(price)}
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </section>

              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="button"
                size="lg"
                className="self-start"
                disabled={!activeAddressId || !activeMethodId}
                onClick={() => setStep(1)}
              >
                Continue to payment
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-medium">Payment</h2>
              <p className="rounded-md border border-dashed border-border bg-cream/50 px-4 py-3 text-sm text-muted-foreground">
                Card payments are processed securely by Stripe — you&rsquo;ll be
                redirected to complete payment, then brought back here.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button type="button" size="lg" disabled={submitting} onClick={onPay}>
                  {submitting
                    ? "Redirecting…"
                    : `Pay ${formatPrice(Math.max(0, subtotal - (promo?.discountPence ?? 0)) + shippingCost)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-6">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                applyPromo();
              }}
            >
              <div className="relative flex-1">
                <TagIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo code"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline" disabled={checkingPromo}>
                Apply
              </Button>
            </form>
            {promoError && <p className="mt-2 text-xs text-destructive">{promoError}</p>}
            {promo && <p className="mt-2 text-xs text-gold-dark">{promo.label} applied</p>}
          </div>
          <OrderSummary
            shipping={step >= 0 ? shippingCost : undefined}
            discount={promo?.discountPence ?? 0}
            discountLabel={promo?.code}
          />
        </aside>
      </div>
    </div>
  );
}
