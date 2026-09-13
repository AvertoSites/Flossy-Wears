"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { SearchIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Price } from "@/components/common/price";
import { useUI } from "@/lib/store/ui";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useSearch } from "@/lib/queries/use-search";

export function SearchDialog() {
  const open = useUI((s) => s.searchOpen);
  const setSearchOpen = useUI((s) => s.setSearchOpen);
  const [term, setTerm] = useState("");
  const debounced = useDebounce(term, 250);
  const router = useRouter();
  const { data, isFetching } = useSearch(debounced);

  function go(href: string) {
    setSearchOpen(false);
    setTerm("");
    router.push(href);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (term.trim()) go(`/search?q=${encodeURIComponent(term.trim())}`);
  }

  return (
    <Dialog open={open} onOpenChange={setSearchOpen}>
      <DialogContent className="top-[12%] translate-y-0 gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Search products</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-3 border-b border-border px-4"
        >
          {isFetching ? (
            <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search verses, styles, colours…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {debounced.trim().length >= 2 && data && data.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches for &ldquo;{debounced}&rdquo;
            </p>
          )}
          {data?.map((product) => (
            <button
              key={product.id}
              onClick={() => go(`/products/${product.slug}`)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-cream"
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded border border-border bg-cream">
                <Image
                  src={product.images[0]}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {product.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {product.verse.reference}
                </span>
              </span>
              <Price value={product.price.amount} className="shrink-0 text-sm" />
            </button>
          ))}
          {debounced.trim().length < 2 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Try &ldquo;faith&rdquo;, &ldquo;hoodie&rdquo; or &ldquo;olive&rdquo;.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
