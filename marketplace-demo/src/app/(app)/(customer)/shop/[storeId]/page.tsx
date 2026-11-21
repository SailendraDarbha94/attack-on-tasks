"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bike, Clock, Search, Star } from "lucide-react";
import { CartLines, useCartSummary } from "@/components/cart";
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CATEGORY_TINT,
  cx,
  EmojiTile,
  EmptyState,
  Modal,
  QtyStepper,
  TINT_BG,
} from "@/components/ui";
import { stockState, useDb } from "@/lib/db";
import { inr } from "@/lib/format";
import { useCart } from "@/lib/session";
import { CATEGORIES, type Category, type Product, type Store } from "@/lib/types";

export default function StorePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const store = useDb((s) => s.stores.find((x) => x.id === storeId) ?? null);

  if (!store) {
    return (
      <EmptyState emoji="🧭" title="We couldn't find that store">
        <Link href="/shop" className="font-bold text-ink underline underline-offset-4">
          Back to all stores
        </Link>
      </EmptyState>
    );
  }
  return <StoreFront store={store} />;
}

function StoreFront({ store }: { store: Store }) {
  const allProducts = useDb((s) => s.products);
  const cartStoreId = useCart((s) => s.storeId);
  const cartLines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const cart = useCartSummary();
  const [category, setCategory] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");
  // Set when adding would replace a cart from another store.
  const [pendingAdd, setPendingAdd] = useState<{ productId: string; qty: number } | null>(null);

  const products = useMemo(
    () => allProducts.filter((p) => p.storeId === store.id && p.active),
    [allProducts, store.id],
  );
  const categories = CATEGORIES.filter((c) => products.some((p) => p.category === c));
  const needle = query.trim().toLowerCase();
  const visible = products.filter(
    (p) => (category === "All" || p.category === category) && (!needle || p.name.toLowerCase().includes(needle)),
  );
  const cartIsHere = cartStoreId === store.id;
  const otherStore = !cartIsHere && cart.store ? cart.store : null;

  function changeQty(product: Product, qty: number) {
    if (otherStore && qty > 0) {
      setPendingAdd({ productId: product.id, qty });
      return;
    }
    setQty(store.id, product.id, qty);
  }

  return (
    <div className="pb-20 lg:pb-0">
      <Link href="/shop" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold hover:underline">
        <ArrowLeft className="size-4" strokeWidth={2.5} />
        All stores
      </Link>

      <section className={cx("rounded-3xl border-2 border-ink p-5 shadow-hard sm:p-7", TINT_BG[store.tint])}>
        <div className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden
            className="grid size-20 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-paper text-5xl shadow-hard-sm"
          >
            {store.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{store.name}</h1>
            <p className="mt-1 font-medium">{store.tagline}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>
            <Star className="size-3.5 fill-mango" strokeWidth={2} />
            {store.ratingCount > 0 ? `${store.rating.toFixed(1)} · ${store.ratingCount.toLocaleString("en-IN")} ratings` : "New store"}
          </Badge>
          <Badge>
            <Clock className="size-3.5" strokeWidth={2.5} />
            {store.deliveryMins} min
          </Badge>
          <Badge>
            <Bike className="size-3.5" strokeWidth={2.5} />
            {inr(store.deliveryFee)} delivery
          </Badge>
          <Badge>Min order {inr(store.minOrder)}</Badge>
          <Badge>{store.area}</Badge>
        </div>
      </section>

      {!store.open ? (
        <p className="mt-4 rounded-2xl border-2 border-ink bg-tomato-soft px-4 py-3 font-semibold">
          This store is closed right now. You can browse, but it isn&apos;t taking orders.
        </p>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-52 flex-1">
              <span className="sr-only">Search this store</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" strokeWidth={2.5} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${store.name}`}
                className="h-11 w-full rounded-xl border-2 border-ink bg-paper pl-9 pr-3 text-[15px] placeholder:text-ink-soft/60 focus:outline-none focus:ring-4 focus:ring-grape/30"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["All", ...categories] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={category === option}
                onClick={() => setCategory(option)}
                className={cx(
                  "h-9 rounded-full border-2 border-ink px-3.5 text-sm font-bold",
                  category === option ? "bg-ink text-white" : "bg-paper hover:bg-ink/5",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="mt-6">
              <EmptyState emoji="📦" title="Nothing on the shelves yet">
                This store is still adding its products. Check back soon.
              </EmptyState>
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-6">
              <EmptyState emoji="🔍" title="No matches">
                Try a different search or category.
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              {visible.map((product) => {
                const state = stockState(product);
                const qty = cartIsHere ? (cartLines[product.id] ?? 0) : 0;
                return (
                  <li key={product.id} className="flex flex-col rounded-2xl border-2 border-ink bg-paper p-3 shadow-hard-sm">
                    <EmojiTile
                      emoji={product.emoji}
                      tint={CATEGORY_TINT[product.category]}
                      className={cx("aspect-[4/3] w-full text-6xl", state === "out" && "opacity-40 grayscale")}
                    />
                    <p className="mt-3 font-bold leading-tight">{product.name}</p>
                    <p className="text-sm text-ink-soft">{product.unit}</p>
                    {state === "low" ? <p className="mt-1 text-xs font-bold text-tomato">Only {product.stock} left</p> : null}
                    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                      <p className="leading-tight">
                        <span className="text-lg font-extrabold">{inr(product.price)}</span>
                        {product.mrp > product.price ? (
                          <span className="ml-1.5 text-xs text-ink-soft line-through">{inr(product.mrp)}</span>
                        ) : null}
                      </p>
                      {state === "out" ? (
                        <span className="text-xs font-bold text-ink-soft">Out of stock</span>
                      ) : (
                        <QtyStepper
                          qty={qty}
                          max={store.open ? product.stock : 0}
                          onChange={(next) => changeQty(product, next)}
                          label={product.name}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="hidden lg:block">
          <Card className="sticky top-24 p-5">
            <h2 className="font-display text-2xl font-extrabold">Your cart</h2>
            {cartIsHere && cart.items.length > 0 ? (
              <>
                <div className="mt-4">
                  <CartLines items={cart.items} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t-2 border-ink/10 pt-4 font-extrabold">
                  <span>Item total</span>
                  <span className="tabular-nums">{inr(cart.subtotal)}</span>
                </div>
                {cart.subtotal < store.minOrder ? (
                  <p className="mt-2 text-sm font-semibold text-ink-soft">
                    Add {inr(store.minOrder - cart.subtotal)} more to reach the minimum order.
                  </p>
                ) : null}
                <Link href="/checkout" className={buttonClass("accent", "lg", "mt-4 w-full")}>
                  Go to checkout
                  <ArrowRight className="size-5" strokeWidth={2.5} />
                </Link>
              </>
            ) : otherStore ? (
              <p className="mt-3 text-sm text-ink-soft">
                Your cart has {cart.count} {cart.count === 1 ? "item" : "items"} from{" "}
                <Link href={`/shop/${otherStore.id}`} className="font-bold text-ink underline underline-offset-4">
                  {otherStore.name}
                </Link>
                . Adding from this store starts a new cart.
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">Nothing here yet. Tap Add on anything you fancy.</p>
            )}
          </Card>
        </aside>
      </div>

      {cartIsHere && cart.items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-ink bg-lime p-3 lg:hidden">
          <Link href="/checkout" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-1 font-extrabold">
            <span>
              {cart.count} {cart.count === 1 ? "item" : "items"} · {inr(cart.subtotal)}
            </span>
            <span className="inline-flex items-center gap-2">
              Checkout
              <ArrowRight className="size-5" strokeWidth={2.5} />
            </span>
          </Link>
        </div>
      ) : null}

      <Modal open={pendingAdd !== null} onClose={() => setPendingAdd(null)} title="Start a new cart?">
        <p className="text-ink-soft">
          Your cart has items from <span className="font-bold text-ink">{otherStore?.name}</span>. A cart holds one
          store at a time, so adding this will empty it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="accent"
            onClick={() => {
              if (pendingAdd) setQty(store.id, pendingAdd.productId, pendingAdd.qty);
              setPendingAdd(null);
            }}
          >
            Start a new cart
          </Button>
          <Button variant="outline" onClick={() => setPendingAdd(null)}>
            Keep my cart
          </Button>
        </div>
      </Modal>
    </div>
  );
}
