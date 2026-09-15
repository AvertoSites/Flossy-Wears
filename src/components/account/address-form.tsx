"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/common/text-field";
import { useAuth } from "@/lib/store/auth";
import { addAddress, updateAddress } from "@/lib/firebase/addresses";
import { addressSchema, type AddressValues } from "@/lib/validations/address";
import type { Address } from "@/types";

export function AddressForm({
  address,
  onSaved,
  onCancel,
}: {
  address?: Address;
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const uid = useAuth((s) => s.user?.uid);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ?? { country: "United Kingdom" },
  });

  async function onSubmit(values: AddressValues) {
    if (!uid) return;
    setSubmitting(true);
    try {
      if (address) {
        await updateAddress(uid, address.id, values);
        onSaved(address.id);
      } else {
        const id = await addAddress(uid, values);
        onSaved(id);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : address ? "Save changes" : "Save address"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
