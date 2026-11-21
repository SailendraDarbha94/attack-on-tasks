"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Minus, PackagePlus, Pencil, Plus, Search } from "lucide-react";
import { StockBadge } from "@/components/status";
import { useStoreSession } from "@/components/store-context";
import {
  Button,
  buttonClass,
  Card,
  CATEGORY_TINT,
  cx,
  EmojiTile,
  EmptyState,
  Field,
  FormError,
  Modal,
  PageTitle,
  SelectField,
  Tabs,
} from "@/components/ui";
import { stockState, useDb } from "@/lib/db";
import { inr } from "@/lib/format";
import { CATEGORIES, type Category, type Product } from "@/lib/types";

type StockFilter = "all" | "low" | "out";

const EMOJI_PICKS = ["🍅", "🥕", "🍎", "🥛", "🥚", "🍚", "🫘", "🍞", "🍪", "🥤", "🧴", "🧼"];

export default function InventoryPage() {
  const { store } = useStoreSession();
  const allProducts = useDb((s) => s.products);
  const saveProduct = useDb((s) => s.saveProduct);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  // undefined: closed. null: adding a new product. Product: editing it.
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [reordering, setReordering] = useState<Product | null>(null);

  const products = useMemo(
    () => allProducts.filter((p) => p.storeId === store.id).sort((a, b) => a.name.localeCompare(b.name)),
    [allProducts, store.id],
  );
  const lowCount = products.filter((p) => stockState(p) === "low").length;
  const outCount = products.filter((p) => stockState(p) === "out").length;
  const needle = query.trim().toLowerCase();
  const visible = products.filter((p) => {
    const state = stockState(p);
    return (
      (category === "all" || p.category === category) &&
      (stockFilter === "all" || state === stockFilter) &&
      (!needle || p.name.toLowerCase().includes(needle))
    );
  });

  return (
    <>
      <PageTitle
        title="Inventory"
        action={
          <Button variant="accent" onClick={() => setEditing(null)}>
            <Plus className="size-5" strokeWidth={3} />
            Add product
          </Button>
        }
      >
        Prices and stock here are what customers see in your store.
      </PageTitle>

      {products.length === 0 ? (
        <EmptyState emoji="📦" title="Your shelves are empty">
          Add your first product and it appears in your store straight away.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={stockFilter}
              onChange={setStockFilter}
              tabs={[
                { id: "all", label: "All", count: products.length },
                { id: "low", label: "Running low", count: lowCount },
                { id: "out", label: "Out of stock", count: outCount },
              ]}
            />
            <label className="relative min-w-48 flex-1">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" strokeWidth={2.5} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                className="h-11 w-full rounded-xl border-2 border-ink bg-paper pl-9 pr-3 text-[15px] placeholder:text-ink-soft/60 focus:outline-none focus:ring-4 focus:ring-grape/30"
              />
            </label>
            <label>
              <span className="sr-only">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as Category | "all")}
                className="h-11 rounded-xl border-2 border-ink bg-paper px-3 text-[15px] font-semibold focus:outline-none focus:ring-4 focus:ring-grape/30"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <div className="mt-6">
              <EmptyState emoji="🔍" title="No products match">
                Try a different search or filter.
              </EmptyState>
            </div>
          ) : (
            <Card className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead>
                  <tr className="border-b-2 border-ink text-left text-xs uppercase tracking-wide text-ink-soft">
                    <th className="px-4 py-3 font-bold">Product</th>
                    <th className="px-4 py-3 text-right font-bold">Price</th>
                    <th className="px-4 py-3 text-center font-bold">In stock</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 text-center font-bold">On sale</th>
                    <th className="px-4 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => {
                    const state = stockState(product);
                    return (
                      <tr key={product.id} className={cx("border-b border-ink/10 last:border-0", !product.active && "bg-ink/[0.04]")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <EmojiTile emoji={product.emoji} tint={CATEGORY_TINT[product.category]} className="size-10 text-xl" />
                            <div className="min-w-0">
                              <p className="font-bold">{product.name}</p>
                              <p className="text-xs text-ink-soft">
                                {product.unit} · {product.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                          <span className="font-bold">{inr(product.price)}</span>
                          {product.mrp > product.price ? (
                            <span className="block text-xs text-ink-soft line-through">{inr(product.mrp)}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-paper hover:bg-ink/5 disabled:opacity-35"
                              disabled={product.stock <= 0}
                              onClick={() => saveProduct({ ...product, stock: product.stock - 1 })}
                              aria-label={`Remove one ${product.name} from stock`}
                            >
                              <Minus className="size-3.5" strokeWidth={3} />
                            </button>
                            <span className="w-9 text-center font-extrabold tabular-nums">{product.stock}</span>
                            <button
                              type="button"
                              className="grid size-7 place-items-center rounded-lg border-2 border-ink bg-paper hover:bg-ink/5"
                              onClick={() => saveProduct({ ...product, stock: product.stock + 1 })}
                              aria-label={`Add one ${product.name} to stock`}
                            >
                              <Plus className="size-3.5" strokeWidth={3} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StockBadge state={state} stock={product.stock} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <label className="inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              role="switch"
                              className="peer sr-only"
                              checked={product.active}
                              onChange={(event) => saveProduct({ ...product, active: event.target.checked })}
                              aria-label={`${product.name} is on sale`}
                            />
                            <span
                              aria-hidden
                              className="relative h-6 w-10 rounded-full border-2 border-ink bg-paper transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-ink/40 after:transition-transform peer-checked:bg-lime peer-checked:after:translate-x-4 peer-checked:after:bg-ink peer-focus-visible:ring-4 peer-focus-visible:ring-grape/40"
                            />
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {state !== "ok" ? (
                              <Button variant="lime" size="sm" onClick={() => setReordering(product)}>
                                <PackagePlus className="size-4" strokeWidth={2.5} />
                                Reorder
                              </Button>
                            ) : null}
                            <Button variant="outline" size="sm" onClick={() => setEditing(product)} aria-label={`Edit ${product.name}`}>
                              <Pencil className="size-4" strokeWidth={2.5} />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        title={editing ? `Edit ${editing.name}` : "Add a product"}
      >
        <ProductForm storeId={store.id} product={editing ?? null} onDone={() => setEditing(undefined)} />
      </Modal>

      <Modal open={reordering !== null} onClose={() => setReordering(null)} title={`Reorder ${reordering?.name ?? ""}`}>
        {reordering ? <ReorderForm product={reordering} onDone={() => setReordering(null)} /> : null}
      </Modal>
    </>
  );
}

function ProductForm({ storeId, product, onDone }: { storeId: string; product: Product | null; onDone: () => void }) {
  const saveProduct = useDb((s) => s.saveProduct);
  const [emoji, setEmoji] = useState(product?.emoji ?? "🛒");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const price = Number(text("price"));
    const mrp = text("mrp") ? Number(text("mrp")) : price;
    const stock = Math.floor(Number(text("stock")));
    const lowStockAt = Math.floor(Number(text("lowStockAt")));
    if (!(price > 0)) return setError("Enter a price above zero.");
    if (mrp < price) return setError("MRP can't be lower than your selling price.");
    if (!(stock >= 0) || !(lowStockAt >= 0)) return setError("Stock numbers can't be negative.");
    saveProduct({
      id: product?.id,
      storeId,
      name: text("name"),
      category: text("category") as Category,
      unit: text("unit"),
      emoji: emoji.trim() || "🛒",
      price,
      mrp,
      stock,
      lowStockAt,
      active: form.get("active") === "on",
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <Field label="Product name" name="name" defaultValue={product?.name} placeholder="Jaggery" required />
        <Field label="Pack size" name="unit" defaultValue={product?.unit} placeholder="500 g" required />
      </div>
      <SelectField label="Category" name="category" defaultValue={product?.category ?? CATEGORIES[0]}>
        {CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectField>
      <div>
        <p className="mb-1.5 text-sm font-bold">Picture</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Emoji for this product"
            value={emoji}
            onChange={(event) => setEmoji(event.target.value)}
            maxLength={4}
            className="h-11 w-16 rounded-xl border-2 border-ink bg-paper text-center text-2xl focus:outline-none focus:ring-4 focus:ring-grape/30"
          />
          {EMOJI_PICKS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEmoji(option)}
              aria-label={`Use ${option}`}
              aria-pressed={emoji === option}
              className={cx(
                "grid size-9 place-items-center rounded-lg border-2 text-lg",
                emoji === option ? "border-ink bg-lime" : "border-ink/15 bg-paper hover:border-ink",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Selling price (₹)" name="price" type="number" min={1} step="1" defaultValue={product?.price} required />
        <Field label="MRP (₹)" name="mrp" type="number" min={1} step="1" defaultValue={product?.mrp} hint="Leave blank to match the price" />
        <Field label="Units in stock" name="stock" type="number" min={0} step="1" defaultValue={product?.stock ?? 0} required />
        <Field label="Warn me at" name="lowStockAt" type="number" min={0} step="1" defaultValue={product?.lowStockAt ?? 5} hint="Counts as running low at this many units" required />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="size-4 accent-ink" />
        On sale to customers
      </label>
      <FormError>{error}</FormError>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent">
          {product ? "Save changes" : "Add product"}
        </Button>
        <Button variant="quiet" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReorderForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const { store } = useStoreSession();
  const allVendors = useDb((s) => s.vendors);
  const createPurchaseOrder = useDb((s) => s.createPurchaseOrder);
  const [sentTo, setSentTo] = useState("");

  const vendors = useMemo(() => {
    const active = allVendors.filter((v) => v.storeId === store.id && v.stage === "active");
    const matching = active.filter((v) => v.supplies.includes(product.category));
    // Vendors who supply this category come first; fall back to everyone.
    return matching.length > 0 ? matching : active;
  }, [allVendors, store.id, product.category]);

  if (sentTo) {
    return (
      <div className="grid gap-4">
        <p className="rounded-xl border-2 border-ink bg-lime px-3 py-2 font-semibold">
          Purchase order sent to {sentTo}. Mark it as received when the stock arrives and your shelf count updates.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/store/vendors?tab=orders" className={buttonClass("primary")} onClick={onDone}>
            See purchase orders
          </Link>
          <Button variant="quiet" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="grid gap-4">
        <p className="text-ink-soft">You have no vendors yet, so there is nobody to order from.</p>
        <Link href="/store/vendors" className={buttonClass("primary", "md", "justify-self-start")}>
          Go to vendors
        </Link>
      </div>
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const vendor = vendors.find((v) => v.id === form.get("vendor"));
    const qty = Math.floor(Number(form.get("qty")));
    const unitCost = Number(form.get("unitCost"));
    if (!vendor || !(qty > 0) || !(unitCost > 0)) return;
    createPurchaseOrder(store.id, vendor.id, [
      { productId: product.id, name: product.name, unit: product.unit, qty, unitCost },
    ]);
    setSentTo(vendor.name);
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <p className="text-sm text-ink-soft">
        {product.stock} of {product.name} ({product.unit}) left on the shelf.
      </p>
      <SelectField label="Order from" name="vendor" defaultValue={vendors[0].id}>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.name} ({vendor.leadTime.toLowerCase()})
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Units to order" name="qty" type="number" min={1} step="1" defaultValue={Math.max(product.lowStockAt * 3, 12)} required />
        <Field label="Cost per unit (₹)" name="unitCost" type="number" min={1} step="1" defaultValue={Math.max(1, Math.round(product.price * 0.8))} required />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent">
          Send purchase order
        </Button>
        <Button variant="quiet" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
