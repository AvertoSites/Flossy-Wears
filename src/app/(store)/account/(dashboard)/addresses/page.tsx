"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/store/auth";
import {
  addressesQueryKey,
  deleteAddress,
  setDefaultAddress,
  useAddresses,
} from "@/lib/firebase/addresses";
import { AddressForm } from "@/components/account/address-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Address } from "@/types";

export default function AddressesPage() {
  const uid = useAuth((s) => s.user?.uid);
  const queryClient = useQueryClient();
  const { data: addresses = [], isPending } = useAddresses(uid);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: addressesQueryKey(uid) });
  }

  async function onDelete(id: string) {
    if (!uid) return;
    await deleteAddress(uid, id);
    invalidate();
  }

  async function onSetDefault(id: string) {
    if (!uid) return;
    await setDefaultAddress(uid, id);
    invalidate();
  }

  if (isPending) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Saved addresses</h2>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            Add address
          </Button>
        )}
      </div>

      {adding && (
        <div className="rounded-xl border border-border bg-card p-5">
          <AddressForm
            onSaved={() => {
              setAdding(false);
              invalidate();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {addresses.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          You haven&rsquo;t saved a delivery address yet.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address: Address) =>
          editingId === address.id ? (
            <div key={address.id} className="rounded-xl border border-border bg-card p-5 sm:col-span-2">
              <AddressForm
                address={address}
                onSaved={() => {
                  setEditingId(null);
                  invalidate();
                }}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div key={address.id} className="rounded-xl border border-border bg-card p-5 text-sm">
              <div className="mb-2 flex items-center gap-2">
                <p className="font-medium">
                  {address.firstName} {address.lastName}
                </p>
                {address.isDefault && <Badge variant="outline">Default</Badge>}
              </div>
              <address className="not-italic text-muted-foreground">
                {address.line1}
                <br />
                {address.line2 && (
                  <>
                    {address.line2}
                    <br />
                  </>
                )}
                {address.city}
                {address.county && `, ${address.county}`}
                <br />
                {address.postcode}
                <br />
                {address.country}
              </address>
              {address.phone && (
                <p className="mt-2 text-muted-foreground">{address.phone}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingId(address.id)}>
                  Edit
                </Button>
                {!address.isDefault && (
                  <Button size="sm" variant="outline" onClick={() => onSetDefault(address.id)}>
                    Make default
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onDelete(address.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
