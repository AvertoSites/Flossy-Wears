"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import type { CartItem } from "@/types";

export function useAddToCart() {
  const addItem = useCart((s) => s.addItem);
  const setCartOpen = useUI((s) => s.setCartOpen);

  return useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      addItem(item, quantity);
      setCartOpen(true);
      toast.success("Added to bag", {
        description: `${item.name} · ${item.colourLabel} · ${item.size.toUpperCase()}`,
      });
    },
    [addItem, setCartOpen],
  );
}
