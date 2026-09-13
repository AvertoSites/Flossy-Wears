"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="grid size-9 place-items-center rounded-md border border-input transition-colors hover:bg-cream disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      {pages.map((p, i) => {
        const prev = pages[i - 1];
        return (
          <span key={p} className="flex items-center gap-1">
            {prev && p - prev > 1 && (
              <span className="px-1 text-muted-foreground">…</span>
            )}
            <button
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "grid size-9 place-items-center rounded-md border text-sm transition-colors",
                p === page
                  ? "border-navy bg-navy text-primary-foreground"
                  : "border-input hover:bg-cream",
              )}
            >
              {p}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="grid size-9 place-items-center rounded-md border border-input transition-colors hover:bg-cream disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRightIcon className="size-4" />
      </button>
    </nav>
  );
}
