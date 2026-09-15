"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2Icon, XIcon } from "lucide-react";
import { uploadProductImage, deleteProductImage } from "@/lib/firebase/storage";
import { cn } from "@/lib/utils";

export function ImageUploader({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const results = await Promise.allSettled(
        Array.from(files).map((file) => uploadProductImage(productId, file)),
      );
      const uploaded = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      if (uploaded.length > 0) onChange([...images, ...uploaded]);

      const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      if (failed.length > 0) {
        setError(failed.map((r) => (r.reason as Error).message).join(" "));
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove(url: string) {
    onChange(images.filter((i) => i !== url));
    deleteProductImage(url); // best-effort, don't block the UI on it
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((url) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-md border border-black/10 bg-[#f1eadb]"
          >
            <Image src={url} alt="" fill sizes="120px" className="object-cover" />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-black/20 text-xs text-muted-foreground hover:border-black/40",
            uploading && "opacity-60",
          )}
        >
          {uploading ? <Loader2Icon className="size-5 animate-spin" /> : "+ Add photos"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {images.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add at least one photo before saving.
        </p>
      )}
    </div>
  );
}
