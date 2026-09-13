"use client";

import { create } from "zustand";

type UIState = {
  cartOpen: boolean;
  mobileNavOpen: boolean;
  searchOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  mobileNavOpen: false,
  searchOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
}));
