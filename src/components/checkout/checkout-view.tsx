"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon, LockIcon, StoreIcon, TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OrderSummary } from "@/components/checkout/order-summary";
import { AddressForm } from "@/components/account/address-form";
import { EmptyCart } from "@/components/cart/empty-cart";
import { TextField } from "@/components/common/text-field";
import { useCart } from "@/lib/store/cart";
import { useAuth } from "@/lib/store/auth";
import { useMounted } from "@/lib/hooks/use-mounted";
import { useAddresses, addressesQueryKey } from "@/lib/firebase/addresses";
import { useStoreSettings } from "@/lib/queries/use-store-settings";
import { createCheckoutSession } from "@/lib/firebase/functions";
import { formatPrice } from "@/lib/format";
import { taxFor } from "@/lib/constants";
import { isCollectionMethod } from "@/lib/delivery";
import { site } from "@/lib/data/site";
import { isValidUkPhone } from "@/lib/validations/uk-address";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const STEPS = ["Delivery", "Payment"] as const;

type PromoPreview = { code: string; label: string; discountPence: number };

export function CheckoutView() {
  const mounted = useMounted();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const uid = user?.uid;
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
  // Collection contact — null until edited, so the account's name pre-fills it.
  const [contactFirstName, setContactFirstName] = useState<string | null>(null);
  const [contactLastName, setContactLastName] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

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
  const discountedSubtotal = Math.max(0, subtotal - (promo?.discountPence ?? 0));
  const priceForMethod = (m: (typeof methods)[number]) => {
    if (m.freeOverPence != null && discountedSubtotal >= m.freeOverPence) return 0;
    const sorted = [...m.bands].sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);
    return (sorted.find((b) => totalWeightGrams <= b.maxWeightGrams) ?? sorted.at(-1))?.price ?? 0;
  };
  const shippingCost = method ? priceForMethod(method) : 0;
  const collecting = isCollectionMethod(method);
  const firstName = (contactFirstName ?? user?.firstName ?? "").trim();
  const lastName = (contactLastName ?? user?.lastName ?? "").trim();
  const phoneValid = isValidUkPhone(contactPhone);
  const contactComplete = !!firstName && !!lastName && phoneValid;
  const deliveryReady = collecting ? contactComplete : !!activeAddressId;

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
    if (!deliveryReady) {
      setError(
        collecting
          ? "Add your name and a UK phone number for collection."
          : "Add a delivery address to continue.",
      );
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
        ...(collecting
          ? { collectionContact: { firstName, lastName, phone: contactPhone.trim() } }
          : { addressId: activeAddressId }),
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
                        className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-4 has-[:checked]:border-navy"
                      >
                        <span className="flex flex-col gap-1">
                          <span className="text-sm">
                            <span className="font-medium">{m.label}</span>:{" "}
                            <span className="font-semibold">
                              {price === 0 ? "Free" : formatPrice(price)}
                            </span>
                          </span>
                          {m.estimate && (
                            <span className="text-xs text-muted-foreground">{m.estimate}</span>
                          )}
                          {m.freeOverPence != null && price > 0 && (
                            <span className="text-xs text-gold-dark">
                              Free on orders over {formatPrice(m.freeOverPence, { compact: true })}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{m.description}</span>
                        </span>
                        <RadioGroupItem id={m.id} value={m.id} />
                      </Label>
                    );
                  })}
                </RadioGroup>
              </section>

              {!collecting && (
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
              )}

              {collecting && (
                <section className="flex flex-col gap-4">
                  <h2 className="text-lg font-medium">Collection details</h2>
                  <div className="flex gap-3 rounded-lg border border-navy/30 bg-cream/60 p-4 text-sm">
                    <StoreIcon className="mt-0.5 size-5 shrink-0 text-navy" />
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-navy">Collect from store — no delivery</p>
                      <p>{site.collection.address}</p>
                      <p className="text-muted-foreground">
                        Collection hours: {site.collection.hours}. We&rsquo;ll email you
                        when your order is ready. {site.collection.instructions}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Who&rsquo;s collecting? We&rsquo;ll use these details to contact you
                    and check your order at the counter.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="First name"
                      name="collectFirstName"
                      autoComplete="given-name"
                      value={contactFirstName ?? user?.firstName ?? ""}
                      onChange={(e) => setContactFirstName(e.target.value)}
                    />
                    <TextField
                      label="Last name"
                      name="collectLastName"
                      autoComplete="family-name"
                      value={contactLastName ?? user?.lastName ?? ""}
                      onChange={(e) => setContactLastName(e.target.value)}
                    />
                    <TextField
                      label="Email"
                      name="collectEmail"
                      type="email"
                      value={user?.email ?? ""}
                      readOnly
                      disabled
                    />
                    <TextField
                      label="Phone number"
                      name="collectPhone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="07123 456789"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      onBlur={() => setPhoneTouched(true)}
                      error={
                        phoneTouched && !phoneValid
                          ? { type: "pattern", message: "Enter a valid UK phone number" }
                          : undefined
                      }
                    />
                  </div>
                </section>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="button"
                size="lg"
                className="self-start"
                disabled={!deliveryReady || !activeMethodId}
                onClick={() => setStep(1)}
              >
                Continue to payment
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-medium">Payment</h2>
              {method && (
                <div className="rounded-lg border border-border p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Delivery method
                  </p>
                  <p className="font-semibold">{method.label}</p>
                  {collecting ? (
                    <p className="text-muted-foreground">
                      Collect from {site.collection.address} · {site.collection.hours}
                      <br />
                      Collecting: {firstName} {lastName} · {contactPhone.trim()}
                    </p>
                  ) : (
                    (() => {
                      const a = addresses.find((x) => x.id === activeAddressId);
                      return a ? (
                        <p className="text-muted-foreground">
                          Delivering to {a.firstName} {a.lastName}, {a.line1}, {a.city},{" "}
                          {a.postcode}
                        </p>
                      ) : null;
                    })()
                  )}
                </div>
              )}
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
                    : `Pay ${formatPrice(discountedSubtotal + shippingCost + taxFor(discountedSubtotal))}`}
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
