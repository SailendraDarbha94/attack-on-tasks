"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Check, Clock, FileText, PackageCheck, Phone, Plus, Send, Sparkles, Star, type LucideIcon } from "lucide-react";
import { StockBadge } from "@/components/status";
import { useStoreSession } from "@/components/store-context";
import {
  Badge,
  Button,
  Card,
  CATEGORY_TINT,
  EmptyState,
  Field,
  FormError,
  Modal,
  PageTitle,
  Tabs,
} from "@/components/ui";
import { stockState, useDb } from "@/lib/db";
import { dateTime, dateTimeInline, dayLabelInline, inr } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import {
  CATEGORIES,
  type Category,
  type PurchaseOrder,
  type PurchaseOrderStatus,
  type Tint,
  type Vendor,
} from "@/lib/types";

type Tab = "active" | "potential" | "orders";
const TABS: Tab[] = ["active", "potential", "orders"];

const PO_STATUS: Record<PurchaseOrderStatus, { label: string; tint: Tint; icon: LucideIcon }> = {
  sent: { label: "Sent to vendor", tint: "mango", icon: Send },
  confirmed: { label: "Confirmed", tint: "sky", icon: Check },
  received: { label: "Received", tint: "mint", icon: PackageCheck },
};

export default function VendorsPage() {
  const { store } = useStoreSession();
  const requested = useSearchParams().get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(requested && TABS.includes(requested) ? requested : "active");
  const allVendors = useDb((s) => s.vendors);
  const allPurchaseOrders = useDb((s) => s.purchaseOrders);
  const now = useNow();
  const [addingVendor, setAddingVendor] = useState(false);
  const [orderingFrom, setOrderingFrom] = useState<Vendor | null>(null);

  const vendors = useMemo(() => allVendors.filter((v) => v.storeId === store.id), [allVendors, store.id]);
  const active = vendors.filter((v) => v.stage === "active");
  const potential = vendors.filter((v) => v.stage === "potential");
  const purchaseOrders = useMemo(
    () => allPurchaseOrders.filter((p) => p.storeId === store.id).sort((a, b) => b.createdAt - a.createdAt),
    [allPurchaseOrders, store.id],
  );
  const openOrders = purchaseOrders.filter((p) => p.status !== "received").length;
  const owed = active.reduce((sum, v) => sum + v.outstanding, 0);

  return (
    <>
      <PageTitle
        title="Vendors"
        action={
          <Button variant="accent" onClick={() => setAddingVendor(true)}>
            <Plus className="size-5" strokeWidth={3} />
            Add vendor
          </Button>
        }
      >
        The suppliers who keep your shelves full, and a few new ones worth a look.
      </PageTitle>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "active", label: "Your vendors", count: active.length },
          { id: "potential", label: "Potential vendors", count: potential.length },
          { id: "orders", label: "Purchase orders", count: openOrders },
        ]}
      />

      <div className="mt-6">
        {tab === "active" ? (
          active.length === 0 ? (
            <EmptyState emoji="🚚" title="No vendors yet">
              Add the suppliers you already buy from, or pick one from the potential vendors tab.
            </EmptyState>
          ) : (
            <>
              <p className="mb-4 text-sm text-ink-soft">
                You owe <span className="font-bold text-ink">{inr(owed)}</span> across {active.length}{" "}
                {active.length === 1 ? "vendor" : "vendors"}.
              </p>
              <div className="grid gap-5 lg:grid-cols-2">
                {active.map((vendor) => (
                  <ActiveVendorCard key={vendor.id} vendor={vendor} now={now} onOrder={() => setOrderingFrom(vendor)} />
                ))}
              </div>
            </>
          )
        ) : null}

        {tab === "potential" ? (
          potential.length === 0 ? (
            <EmptyState emoji="🔭" title="No suggestions right now">
              We&apos;ll list suppliers here when they match what you sell.
            </EmptyState>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {potential.map((vendor) => (
                <PotentialVendorCard key={vendor.id} vendor={vendor} now={now} />
              ))}
            </div>
          )
        ) : null}

        {tab === "orders" ? (
          purchaseOrders.length === 0 ? (
            <EmptyState emoji="🧾" title="No purchase orders yet">
              Raise one from a vendor card, or from the Reorder button on a low-stock item.
            </EmptyState>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {purchaseOrders.map((purchaseOrder) => (
                <PurchaseOrderCard
                  key={purchaseOrder.id}
                  purchaseOrder={purchaseOrder}
                  vendor={vendors.find((v) => v.id === purchaseOrder.vendorId)}
                  now={now}
                />
              ))}
            </div>
          )
        ) : null}
      </div>

      <Modal open={addingVendor} onClose={() => setAddingVendor(false)} title="Add a vendor">
        <VendorForm storeId={store.id} onDone={() => setAddingVendor(false)} />
      </Modal>

      <Modal
        open={orderingFrom !== null}
        onClose={() => setOrderingFrom(null)}
        title={`Order from ${orderingFrom?.name ?? ""}`}
      >
        {orderingFrom ? (
          <PurchaseOrderForm
            vendor={orderingFrom}
            onDone={() => {
              setOrderingFrom(null);
              setTab("orders");
            }}
            onCancel={() => setOrderingFrom(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}

function Supplies({ categories }: { categories: Category[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((category) => (
        <Badge key={category} tint={CATEGORY_TINT[category]}>
          {category}
        </Badge>
      ))}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  );
}

function VendorHeading({ vendor }: { vendor: Vendor }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-xl font-extrabold leading-tight">{vendor.name}</h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink-soft">
          {vendor.contact}
          <span className="inline-flex items-center gap-1">
            <Phone className="size-3.5" strokeWidth={2.5} />
            {vendor.phone}
          </span>
        </p>
      </div>
      {vendor.rating > 0 ? (
        <Badge>
          <Star className="size-3.5 fill-mango" strokeWidth={2} />
          {vendor.rating.toFixed(1)}
        </Badge>
      ) : null}
    </div>
  );
}

function ActiveVendorCard({ vendor, now, onOrder }: { vendor: Vendor; now: number; onOrder: () => void }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <VendorHeading vendor={vendor} />
      <Supplies categories={vendor.supplies} />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Detail label="Based in">{vendor.area}</Detail>
        <Detail label="Delivers">{vendor.leadTime}</Detail>
        <Detail label="Payment terms">{vendor.terms}</Detail>
        <Detail label="Last delivery">{vendor.lastDeliveryAt ? dateTime(vendor.lastDeliveryAt, now) : "None yet"}</Detail>
      </dl>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/10 pt-4">
        <p className="text-sm">
          <span className="text-ink-soft">You owe </span>
          <span className="text-lg font-extrabold tabular-nums">{inr(vendor.outstanding)}</span>
        </p>
        <Button variant="primary" size="sm" onClick={onOrder}>
          <FileText className="size-4" strokeWidth={2.5} />
          New purchase order
        </Button>
      </div>
    </Card>
  );
}

function PotentialVendorCard({ vendor, now }: { vendor: Vendor; now: number }) {
  const activateVendor = useDb((s) => s.activateVendor);
  const requestQuote = useDb((s) => s.requestQuote);
  return (
    <Card className="flex flex-col gap-4 p-5">
      <VendorHeading vendor={vendor} />
      <Supplies categories={vendor.supplies} />
      {vendor.pitch ? (
        <p className="flex items-start gap-2 rounded-xl border-2 border-ink bg-lime px-3 py-2 text-sm font-semibold">
          <Sparkles className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
          {vendor.pitch}
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Detail label="Based in">{vendor.area}</Detail>
        <Detail label="Delivers">{vendor.leadTime}</Detail>
        <Detail label="Payment terms">{vendor.terms}</Detail>
      </dl>
      <div className="mt-auto flex flex-wrap items-center gap-3 border-t-2 border-ink/10 pt-4">
        {vendor.quoteRequestedAt ? (
          <Badge tint="sky">
            <Clock className="size-3.5" strokeWidth={2.5} />
            Quote requested {dayLabelInline(vendor.quoteRequestedAt, now)}
          </Badge>
        ) : (
          <Button variant="outline" size="sm" onClick={() => requestQuote(vendor.id)}>
            Request a quote
          </Button>
        )}
        <Button variant="accent" size="sm" onClick={() => activateVendor(vendor.id)}>
          <Plus className="size-4" strokeWidth={3} />
          Add to my vendors
        </Button>
      </div>
    </Card>
  );
}

function PurchaseOrderCard({ purchaseOrder, vendor, now }: { purchaseOrder: PurchaseOrder; vendor?: Vendor; now: number }) {
  const receivePurchaseOrder = useDb((s) => s.receivePurchaseOrder);
  const status = PO_STATUS[purchaseOrder.status];
  const StatusIcon = status.icon;
  const received = purchaseOrder.status === "received";
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="font-display text-xl font-extrabold">{purchaseOrder.code}</h3>
        <Badge tint={status.tint}>
          <StatusIcon className="size-3.5" strokeWidth={2.5} />
          {status.label}
        </Badge>
      </div>
      <p className="text-sm">
        <span className="font-bold">{vendor?.name ?? "Vendor"}</span>
        <span className="text-ink-soft">
          {" "}
          · raised {dateTimeInline(purchaseOrder.createdAt, now)}
          {received ? "" : ` · expected ${dayLabelInline(purchaseOrder.expectedAt, now)}`}
        </span>
      </p>
      <ul className="grid gap-1 border-t-2 border-ink/10 pt-3 text-sm">
        {purchaseOrder.lines.map((line) => (
          <li key={line.productId} className="flex justify-between gap-3">
            <span>
              <span className="font-bold">{line.qty} ×</span> {line.name} <span className="text-ink-soft">({line.unit})</span>
            </span>
            <span className="tabular-nums text-ink-soft">
              {inr(line.unitCost)} each · <span className="text-ink">{inr(line.qty * line.unitCost)}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-lg font-extrabold tabular-nums">{inr(purchaseOrder.total)}</p>
        {!received ? (
          <Button variant="lime" size="sm" onClick={() => receivePurchaseOrder(purchaseOrder.id)}>
            <PackageCheck className="size-4" strokeWidth={2.5} />
            Mark as received
          </Button>
        ) : (
          <p className="text-sm text-ink-soft">Stock added to your shelves</p>
        )}
      </div>
    </Card>
  );
}

function PurchaseOrderForm({ vendor, onDone, onCancel }: { vendor: Vendor; onDone: () => void; onCancel: () => void }) {
  const { store } = useStoreSession();
  const allProducts = useDb((s) => s.products);
  const createPurchaseOrder = useDb((s) => s.createPurchaseOrder);

  const products = useMemo(() => {
    const mine = allProducts.filter((p) => p.storeId === store.id);
    const matching = mine.filter((p) => vendor.supplies.includes(p.category));
    // Low stock first, so the items that need ordering are at the top.
    return (matching.length > 0 ? matching : mine).sort((a, b) => a.stock - b.stock);
  }, [allProducts, store.id, vendor.supplies]);

  // Anything running low starts with a suggested quantity filled in.
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      products.filter((p) => stockState(p) !== "ok").map((p) => [p.id, Math.max(p.lowStockAt * 3, 12)]),
    ),
  );

  const costOf = (price: number) => Math.max(1, Math.round(price * 0.8));
  const lines = products
    .filter((p) => (quantities[p.id] ?? 0) > 0)
    .map((p) => ({ productId: p.id, name: p.name, unit: p.unit, qty: quantities[p.id], unitCost: costOf(p.price) }));
  const total = lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0);

  if (products.length === 0) {
    return <p className="text-ink-soft">Add products to your inventory first, then you can order them here.</p>;
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-ink-soft">
        Delivers {vendor.leadTime.toLowerCase()}. Items running low already have a suggested quantity.
      </p>
      <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
        {products.map((product) => (
          <li key={product.id} className="flex items-center gap-3 rounded-xl border-2 border-ink/15 bg-paper p-2.5">
            <span aria-hidden className="text-2xl">
              {product.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{product.name}</p>
              <p className="text-xs text-ink-soft">
                {product.unit} · {inr(costOf(product.price))} each
              </p>
            </div>
            <StockBadge state={stockState(product)} stock={product.stock} />
            <input
              type="number"
              min={0}
              step={1}
              aria-label={`Units of ${product.name} to order`}
              value={quantities[product.id] ?? 0}
              onChange={(event) =>
                setQuantities((current) => ({ ...current, [product.id]: Math.max(0, Math.floor(Number(event.target.value) || 0)) }))
              }
              className="h-9 w-16 rounded-lg border-2 border-ink bg-paper px-2 text-center text-sm font-bold tabular-nums focus:outline-none focus:ring-4 focus:ring-grape/30"
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/10 pt-4">
        <p>
          <span className="text-sm text-ink-soft">Order total </span>
          <span className="text-lg font-extrabold tabular-nums">{inr(total)}</span>
        </p>
        <div className="flex gap-3">
          <Button variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="accent"
            disabled={lines.length === 0}
            onClick={() => {
              createPurchaseOrder(store.id, vendor.id, lines);
              onDone();
            }}
          >
            Send purchase order
          </Button>
        </div>
      </div>
    </div>
  );
}

function VendorForm({ storeId, onDone }: { storeId: string; onDone: () => void }) {
  const createVendor = useDb((s) => s.createVendor);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const supplies = CATEGORIES.filter((category) => form.getAll("supplies").includes(category));
    if (supplies.length === 0) {
      setError("Tick at least one thing this vendor supplies.");
      return;
    }
    createVendor({
      storeId,
      name: text("name"),
      contact: text("contact"),
      phone: text("phone"),
      area: text("area"),
      supplies,
      terms: text("terms") || "Pay on delivery",
      leadTime: text("leadTime") || "Next day",
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Business name" name="name" placeholder="Cauvery Wholesale" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact person" name="contact" placeholder="Ramesh" required />
        <Field label="Phone" name="phone" type="tel" placeholder="+91 90000 00000" required />
      </div>
      <Field label="Based in" name="area" placeholder="Yeshwanthpur" required />
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold">What do they supply?</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="supplies" value={category} className="size-4 accent-ink" />
              {category}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment terms" name="terms" placeholder="Net 15 days" />
        <Field label="Delivery time" name="leadTime" placeholder="Next day" />
      </div>
      <FormError>{error}</FormError>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent">
          Add vendor
        </Button>
        <Button variant="quiet" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
