"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

type AddPayload = Omit<CartItem, "quantity">;

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  /** Promo code applied in the cart — carried through to checkout, re-validated server-side there. */
  discountCode: string | null;
  addItem: (item: AddPayload, quantity?: number) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  setDiscountCode: (code: string | null) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
  savings: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      discountCode: null,
      setDiscountCode: (code) => set({ discountCode: code }),
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            const next = Math.min(existing.quantity + quantity, item.maxStock);
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: next } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: Math.min(quantity, item.maxStock) },
            ],
          };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id
                    ? { ...i, quantity: Math.min(quantity, i.maxStock) }
                    : i,
                ),
        })),
      clear: () => set({ items: [], discountCode: null }),
      totalItems: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      savings: () =>
        get().items.reduce(
          (sum, i) =>
            sum +
            (i.compareAtPrice ? (i.compareAtPrice - i.price) * i.quantity : 0),
          0,
        ),
    }),
    {
      name: "flossywears-cart",
      partialize: (state) => ({ items: state.items, discountCode: state.discountCode }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
