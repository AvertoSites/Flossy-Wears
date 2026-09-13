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
  const [threshold, setThreshold] = useState(
    (settings.freeShippingThreshold / 100).toString(),
  );
  const [methods, setMethods] = useState(settings.shippingMethods);

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        storeName,
        supportEmail,
        freeShippingThreshold: Math.round(parseFloat(threshold || "0") * 100),
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="thr">Free delivery threshold (£)</Label>
              <Input
                id="thr"
                inputMode="decimal"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card title="Delivery methods">
          <div className="flex flex-col gap-4">
            {methods.map((method, i) => (
              <div
                key={method.id}
                className="grid grid-cols-[1fr_100px] gap-3 border-b border-black/5 pb-3 last:border-0 last:pb-0"
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
                <div className="flex flex-col gap-1.5">
                  <Label>Price (£)</Label>
                  <Input
                    inputMode="decimal"
                    value={(method.price / 100).toString()}
                    onChange={(e) =>
                      setMethods((m) =>
                        m.map((x, xi) =>
                          xi === i
                            ? {
                                ...x,
                                price: Math.round(
                                  parseFloat(e.target.value || "0") * 100,
                                ),
                              }
                            : x,
                        ),
                      )
                    }
                  />
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
