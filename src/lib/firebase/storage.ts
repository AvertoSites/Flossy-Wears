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

/* ----------------------------- review photos ----------------------------- */

export const MAX_REVIEW_IMAGES = 3;
// Raw input cap — just to avoid decoding something enormous in the browser.
// What actually gets uploaded is the re-encoded JPEG (storage.rules: <3MB).
const MAX_REVIEW_SOURCE_BYTES = 20 * 1024 * 1024;
const REVIEW_IMAGE_MAX_EDGE = 1600;

export type CompressedImage = { blob: Blob; width: number; height: number };

/**
 * Downscales a shopper photo to ≤1600px on its long edge and re-encodes it as
 * JPEG. Besides shrinking 5–10MB phone shots to a few hundred KB, redrawing
 * through a canvas drops all EXIF metadata — phone photos usually carry the
 * GPS location they were taken at, which must not end up on a public page.
 */
export async function compressReviewImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} isn't an image file.`);
  }
  if (file.size > MAX_REVIEW_SOURCE_BYTES) {
    throw new Error(`${file.name} is larger than 20MB.`);
  }

  let bitmap: ImageBitmap;
  try {
    // Applies EXIF orientation by default, so portrait shots stay upright.
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      `We couldn't read ${file.name} — please use a JPEG or PNG photo.`,
    );
  }

  const scale = Math.min(1, REVIEW_IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  // JPEG has no alpha — paint transparent PNG areas white rather than black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error(`We couldn't process ${file.name} — try another photo.`);
  return { blob, width, height };
}

/** Uploads one compressed review photo and returns its Storage path. The shopper can't read it back — see storage.rules. */
export async function uploadReviewImage(
  uid: string,
  reviewId: string,
  index: number,
  image: CompressedImage,
): Promise<string> {
  const path = `review-images/${uid}/${reviewId}/${index}.jpg`;
  try {
    await uploadBytes(ref(storage, path), image.blob, { contentType: "image/jpeg" });
  } catch (error) {
    const code = (error as StorageError | undefined)?.code;
    if (code === "storage/unauthorized") {
      throw new Error("Your photo couldn't be uploaded — please sign in again and retry.");
    }
    throw new Error(describeStorageError(error));
  }
  return path;
}

/** Best-effort delete — if it's already gone or the URL isn't one of ours, just ignore it. */
export async function deleteProductImage(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // ignore — image may already be deleted, or this URL isn't a Storage ref.
  }
}
