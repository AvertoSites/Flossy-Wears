"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
// useWatch keeps subscriptions compiler-friendly vs. the raw `watch()` fn.
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TextField } from "@/components/common/text-field";
import { OrderSummary } from "@/components/checkout/order-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { useCart } from "@/lib/store/cart";
import { useMounted } from "@/lib/hooks/use-mounted";
import { SHIPPING_METHODS } from "@/lib/constants";
import { site } from "@/lib/data/site";
import { formatPrice } from "@/lib/format";
import { checkoutSchema, type CheckoutValues } from "@/lib/validations/checkout";
import { cn } from "@/lib/utils";

const STEPS = ["Details", "Delivery", "Payment"] as const;

export function CheckoutView() {
  const mounted = useMounted();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: "United Kingdom",
      marketingOptIn: false,
      shippingMethodId: SHIPPING_METHODS[0].id,
    },
    mode: "onTouched",
  });

  const shippingMethodId = useWatch({ control, name: "shippingMethodId" });
  const marketingOptIn = useWatch({ control, name: "marketingOptIn" });
  const method =
    SHIPPING_METHODS.find((m) => m.id === shippingMethodId) ?? SHIPPING_METHODS[0];
  const freeShipping = subtotal >= site.freeShippingThreshold;
  const shippingCost = freeShipping ? 0 : method.price;

  if (!mounted) return null;
  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyCart />
      </div>
    );
  }

  async function next() {
    const fields: (keyof CheckoutValues)[] =
      step === 0
        ? ["email", "firstName", "lastName", "line1", "city", "postcode", "phone", "country"]
        : ["shippingMethodId"];
    if (await trigger(fields)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(values: CheckoutValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          shippingMethodId: freeShipping ? "standard" : values.shippingMethodId,
          lines: items.map((i) => ({
            name: `${i.name} — ${i.colourLabel} / ${i.size.toUpperCase()}`,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
        }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.assign(data.url);
      } else {
        router.push("/checkout/success?mock=1");
      }
    } catch {
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-medium">Contact</h2>
                <TextField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  error={errors.email}
                  {...register("email")}
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={marketingOptIn}
                    onCheckedChange={(c) => setValue("marketingOptIn", !!c)}
                  />
                  Email me new drops and offers
                </label>
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-medium">Delivery address</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="First name" autoComplete="given-name" error={errors.firstName} {...register("firstName")} />
                  <TextField label="Last name" autoComplete="family-name" error={errors.lastName} {...register("lastName")} />
                </div>
                <TextField label="Address line 1" autoComplete="address-line1" error={errors.line1} {...register("line1")} />
                <TextField label="Address line 2 (optional)" autoComplete="address-line2" error={errors.line2} {...register("line2")} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Town / city" autoComplete="address-level2" error={errors.city} {...register("city")} />
                  <TextField label="County (optional)" error={errors.county} {...register("county")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Postcode" autoComplete="postal-code" error={errors.postcode} {...register("postcode")} />
                  <TextField label="Country" autoComplete="country-name" error={errors.country} {...register("country")} />
                </div>
                <TextField label="Phone" type="tel" autoComplete="tel" error={errors.phone} {...register("phone")} />
              </section>

              <Button type="button" size="lg" onClick={next} className="self-start">
                Continue to delivery
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-medium">Delivery method</h2>
              {freeShipping && (
                <p className="rounded-md bg-cream px-3 py-2 text-sm text-gold-dark">
                  Free delivery unlocked on this order.
                </p>
              )}
              <RadioGroup
                value={shippingMethodId}
                onValueChange={(v) => setValue("shippingMethodId", v)}
                className="flex flex-col gap-3"
              >
                {SHIPPING_METHODS.map((m) => (
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
                      {freeShipping || m.price === 0 ? "Free" : formatPrice(m.price)}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button type="button" size="lg" onClick={next}>
                  Continue to payment
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-medium">Payment</h2>
              <p className="rounded-md border border-dashed border-border bg-cream/50 px-4 py-3 text-sm text-muted-foreground">
                Card payments are processed securely by Stripe. In this preview
                build, &ldquo;Pay now&rdquo; creates a Stripe Checkout session when keys are
                configured, otherwise it completes with a mock confirmation.
              </p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting
                    ? "Redirecting…"
                    : `Pay ${formatPrice(subtotal + shippingCost)}`}
                </Button>
              </div>
            </div>
          )}
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary shipping={step >= 1 ? shippingCost : undefined} />
        </aside>
      </div>
    </div>
  );
}
