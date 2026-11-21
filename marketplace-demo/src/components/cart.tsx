"use client";

import { useMemo } from "react";
import { useDb } from "@/lib/db";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/session";
import type { Product, Store } from "@/lib/types";
import { CATEGORY_TINT, EmojiTile, QtyStepper } from "./ui";

export interface CartItem {
  product: Product;
  /** What the customer asked for. */
  qty: number;
  /** What the shelf can actually supply right now. */
  payable: number;
}

export interface CartSummary {
  store: Store | null;
  items: CartItem[];
  count: number;
  subtotal: number;
}

/** The cart joined with live product data, so prices and stock are always current. */
export function useCartSummary(): CartSummary {
  const storeId = useCart((s) => s.storeId);
  const lines = useCart((s) => s.lines);
  const stores = useDb((s) => s.stores);
  const products = useDb((s) => s.products);

  return useMemo(() => {
    const store = stores.find((s) => s.id === storeId) ?? null;
    const items = Object.entries(lines).flatMap(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return [];
      const available = product.active ? Math.max(product.stock, 0) : 0;
      return [{ product, qty, payable: Math.min(qty, available) }];
    });
    return {
      store,
      items,
      count: items.reduce((sum, item) => sum + item.payable, 0),
      subtotal: items.reduce((sum, item) => sum + item.payable * item.product.price, 0),
    };
  }, [storeId, lines, stores, products]);
}

export function CartLines({ items }: { items: CartItem[] }) {
  const setQty = useCart((s) => s.setQty);
  return (
    <ul className="grid gap-3">
      {items.map(({ product, qty, payable }) => (
        <li key={product.id} className="flex items-center gap-3">
          <EmojiTile emoji={product.emoji} tint={CATEGORY_TINT[product.category]} className="size-11 text-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{product.name}</p>
            <p className="text-xs text-ink-soft">
              {product.unit} · {inr(product.price)}
            </p>
            {payable < qty ? (
              <p className="text-xs font-bold text-tomato">
                {payable === 0 ? "No longer available" : `Only ${payable} available`}
              </p>
            ) : null}
          </div>
          <QtyStepper
            qty={qty}
            max={product.active ? product.stock : 0}
            onChange={(next) => setQty(product.storeId, product.id, next)}
            label={product.name}
          />
          <p className="w-14 text-right text-sm font-extrabold tabular-nums">{inr(payable * product.price)}</p>
        </li>
      ))}
    </ul>
  );
}
