import 'expo-sqlite/localStorage/install';

import { MAX_QTY_PER_ITEM, type CatalogItem } from '@nukkad/core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartLine = {
  productId: string;
  name: string;
  unitLabel: string;
  emoji: string;
  /** The price shown when it was added. The server prices the order itself. */
  pricePaise: number;
  qty: number;
};

/** What the cart needs to know about a product to hold it. */
export type CartProduct = Pick<CatalogItem, 'productId' | 'name' | 'unitLabel' | 'emoji' | 'pricePaise'>;

type CartState = {
  storeId: string | null;
  storeName: string | null;
  lines: CartLine[];
  /**
   * Sent with the order so a retried request cannot place it twice. It changes
   * whenever the cart does, so a changed cart is always a new order.
   */
  idempotencyKey: string;
  /** A cart holds one store's products; setting a quantity for another store starts it over. */
  setQty: (store: { id: string; name: string }, item: CartProduct, qty: number) => void;
  clear: () => void;
};

function newKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      storeId: null,
      storeName: null,
      lines: [],
      idempotencyKey: newKey(),

      setQty: (store, item, qty) =>
        set((state) => {
          const wanted = Math.max(0, Math.min(qty, MAX_QTY_PER_ITEM));
          const current = state.storeId === store.id ? state.lines : [];
          const exists = current.some((line) => line.productId === item.productId);
          const lines =
            wanted === 0
              ? current.filter((line) => line.productId !== item.productId)
              : exists
                ? current.map((line) => (line.productId === item.productId ? { ...line, qty: wanted } : line))
                : [
                    ...current,
                    {
                      productId: item.productId,
                      name: item.name,
                      unitLabel: item.unitLabel,
                      emoji: item.emoji,
                      pricePaise: item.pricePaise,
                      qty: wanted,
                    },
                  ];
          return lines.length === 0
            ? { lines, storeId: null, storeName: null, idempotencyKey: newKey() }
            : { lines, storeId: store.id, storeName: store.name, idempotencyKey: newKey() };
        }),

      clear: () => set({ storeId: null, storeName: null, lines: [], idempotencyKey: newKey() }),
    }),
    { name: 'nukkad.cart', storage: createJSONStorage(() => localStorage) },
  ),
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.pricePaise * line.qty, 0);
}
