"use client";

// Who is signed in, and what is in their cart. Both live in sessionStorage, so
// each browser tab is its own session: sign in as a customer in one tab and as
// a store in another to watch an order travel between them.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SessionState {
  accountId: string | null;
  setAccount: (accountId: string | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      accountId: null,
      setAccount: (accountId) => set({ accountId }),
    }),
    { name: "nukkad-demo-session-v1", storage: createJSONStorage(() => sessionStorage) },
  ),
);

interface CartState {
  /** A cart holds items from one store at a time. */
  storeId: string | null;
  lines: Record<string, number>;
  addressId: string | null;
  setQty: (storeId: string, productId: string, qty: number) => void;
  setAddress: (addressId: string | null) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      storeId: null,
      lines: {},
      addressId: null,
      setQty(storeId, productId, qty) {
        set((s) => {
          // Adding from a different store starts a fresh cart.
          const lines = s.storeId === storeId ? { ...s.lines } : {};
          if (qty > 0) lines[productId] = qty;
          else delete lines[productId];
          const empty = Object.keys(lines).length === 0;
          return { storeId: empty ? null : storeId, lines };
        });
      },
      setAddress: (addressId) => set({ addressId }),
      clear: () => set({ storeId: null, lines: {} }),
    }),
    { name: "nukkad-demo-cart-v1", storage: createJSONStorage(() => sessionStorage) },
  ),
);

export function cartCount(lines: Record<string, number>): number {
  return Object.values(lines).reduce((sum, qty) => sum + qty, 0);
}
