"use client";

import { deleteObject, getDownloadURL, ref, uploadBytes, type StorageError } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

// Mirrors the caps enforced by storage.rules — checking client-side gives a
// specific, immediate error instead of an opaque storage/unauthorized from
// the rules rejection.
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Throws a human-readable message if `file` would be rejected by storage.rules. */
export function validateProductImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} isn't an image file.`);
  }
  if (file.size >= MAX_IMAGE_BYTES) {
    throw new Error(`${file.name} is larger than 10MB.`);
  }
}

function describeStorageError(error: unknown): string {
  const code = (error as StorageError | undefined)?.code;
  switch (code) {
    case "storage/unauthorized":
      return "You don't have permission to upload — make sure you're signed in as an admin.";
    case "storage/canceled":
      return "Upload was canceled.";
    case "storage/quota-exceeded":
      return "Storage quota exceeded.";
    case "storage/retry-limit-exceeded":
      return "Upload timed out — check your connection and try again.";
    default:
      return error instanceof Error ? error.message : "Upload failed — try again.";
  }
}

/** Uploads one product photo under `product-images/{productId}/` and returns its public download URL. Admin-only — see storage.rules. */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  validateProductImage(file);
  const path = `product-images/${productId}/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  try {
    await uploadBytes(fileRef, file);
  } catch (error) {
    throw new Error(describeStorageError(error));
  }
  return getDownloadURL(fileRef);
}

/** Best-effort delete — if it's already gone or the URL isn't one of ours, just ignore it. */
export async function deleteProductImage(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // ignore — image may already be deleted, or this URL isn't a Storage ref.
  }
}
