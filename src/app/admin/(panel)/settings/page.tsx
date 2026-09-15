"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/admin/client";
import { AdminHeader, Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { StoreSettings } from "@/types";

export default function AdminSettingsPage() {
  const { data, isPending } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: adminApi.settings,
  });

  if (isPending || !data) {
    return (
      <>
        <AdminHeader title="Settings" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </>
    );
  }

  return <SettingsForm key={data.settings.storeName} settings={data.settings} />;
}

function SettingsForm({ settings }: { settings: StoreSettings }) {
  const qc = useQueryClient();
  const [storeName, setStoreName] = useState(settings.storeName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [methods, setMethods] = useState(settings.shippingMethods);

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        storeName,
        supportEmail,
        shippingMethods: methods,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <AdminHeader
        title="Settings"
        description="Store details and delivery options."
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Store">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Store name</Label>
              <Input
                id="name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Support email</Label>
              <Input
                id="email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card title="Delivery methods">
          <p className="mb-4 text-xs text-muted-foreground">
            Shipping is free on every order for now. Each method below has one
            price band per weight bracket — once real Royal Mail rates are
            sorted out, split a band or edit its price here to start charging
            for it.
          </p>
          <div className="flex flex-col gap-5">
            {methods.map((method, i) => (
              <div
                key={method.id}
                className="border-b border-black/5 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-col gap-1.5">
                  <Label>{method.label}</Label>
                  <Input
                    value={method.description}
                    onChange={(e) =>
                      setMethods((m) =>
                        m.map((x, xi) =>
                          xi === i ? { ...x, description: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {method.bands.map((band, bi) => (
                    <div key={bi} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Up to weight (kg)</Label>
                        <Input
                          inputMode="decimal"
                          value={(band.maxWeightGrams / 1000).toString()}
                          onChange={(e) =>
                            setMethods((m) =>
                              m.map((x, xi) =>
                                xi === i
                                  ? {
                                      ...x,
                                      bands: x.bands.map((b, xbi) =>
                                        xbi === bi
                                          ? {
                                              ...b,
                                              maxWeightGrams: Math.round(
                                                parseFloat(e.target.value || "0") * 1000,
                                              ),
                                            }
                                          : b,
                                      ),
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Price (£)</Label>
                        <Input
                          inputMode="decimal"
                          value={(band.price / 100).toString()}
                          onChange={(e) =>
                            setMethods((m) =>
                              m.map((x, xi) =>
                                xi === i
                                  ? {
                                      ...x,
                                      bands: x.bands.map((b, xbi) =>
                                        xbi === bi
                                          ? {
                                              ...b,
                                              price: Math.round(
                                                parseFloat(e.target.value || "0") * 100,
                                              ),
                                            }
                                          : b,
                                      ),
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={method.bands.length <= 1}
                        onClick={() =>
                          setMethods((m) =>
                            m.map((x, xi) =>
                              xi === i
                                ? { ...x, bands: x.bands.filter((_, xbi) => xbi !== bi) }
                                : x,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() =>
                      setMethods((m) =>
                        m.map((x, xi) =>
                          xi === i
                            ? { ...x, bands: [...x.bands, { maxWeightGrams: 0, price: 0 }] }
                            : x,
                        ),
                      )
                    }
                  >
                    Add weight band
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6" title="Payments">
        <p className="text-sm text-muted-foreground">
          Card payments run through Stripe. Set{" "}
          <code className="rounded bg-black/5 px-1">STRIPE_SECRET_KEY</code> and{" "}
          <code className="rounded bg-black/5 px-1">
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
          </code>{" "}
          in your environment to enable live checkout and refunds. Until then the
          store runs in mock mode.
        </p>
      </Card>
    </>
  );
}
