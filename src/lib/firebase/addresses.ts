"use client";

import { useQuery } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import type { AddressValues } from "@/lib/validations/address";
import type { Address } from "@/types";

function addressesRef(uid: string) {
  return collection(firestore, "users", uid, "addresses");
}

export async function listAddresses(uid: string): Promise<Address[]> {
  const snap = await getDocs(addressesRef(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Address);
}

export async function addAddress(uid: string, values: AddressValues): Promise<string> {
  const existing = await getDocs(addressesRef(uid));
  const isDefault = existing.empty; // first address a customer saves becomes their default automatically
  const ref = await addDoc(addressesRef(uid), { ...values, isDefault });
  return ref.id;
}

export async function updateAddress(
  uid: string,
  addressId: string,
  values: AddressValues,
): Promise<void> {
  await updateDoc(doc(firestore, "users", uid, "addresses", addressId), { ...values });
}

export async function deleteAddress(uid: string, addressId: string): Promise<void> {
  await deleteDoc(doc(firestore, "users", uid, "addresses", addressId));
}

async function clearDefault(uid: string): Promise<void> {
  const snap = await getDocs(addressesRef(uid));
  const batch = writeBatch(firestore);
  snap.docs.forEach((d) => {
    if (d.data().isDefault) batch.update(d.ref, { isDefault: false });
  });
  await batch.commit();
}

export async function setDefaultAddress(uid: string, addressId: string): Promise<void> {
  await clearDefault(uid);
  await updateDoc(doc(firestore, "users", uid, "addresses", addressId), { isDefault: true });
}

export function addressesQueryKey(uid: string | undefined) {
  return ["addresses", uid] as const;
}

export function useAddresses(uid: string | undefined) {
  return useQuery({
    queryKey: addressesQueryKey(uid),
    queryFn: () => listAddresses(uid!),
    enabled: !!uid,
  });
}
