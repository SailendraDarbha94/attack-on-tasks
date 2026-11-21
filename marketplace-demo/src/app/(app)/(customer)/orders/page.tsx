"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { PartyPopper } from "lucide-react";
import { ORDER_STATUS, OrderStatusBadge, OrderTracker } from "@/components/status";
import { Card, EmojiTile, EmptyState, PageTitle } from "@/components/ui";
import { isOpenOrder, useDb } from "@/lib/db";
import { addressLine, dateTime, inr } from "@/lib/format";
import { useAccount, useNow } from "@/lib/hooks";
import type { Order, Store } from "@/lib/types";

export default function OrdersPage() {
  const account = useAccount();
  const placedId = useSearchParams().get("placed");
  const allOrders = useDb((s) => s.orders);
  const stores = useDb((s) => s.stores);
  const now = useNow();

  const orders = useMemo(
    () => allOrders.filter((o) => o.customerId === account?.id).sort((a, b) => b.placedAt - a.placedAt),
    [allOrders, account?.id],
  );
  if (!account) return null;

  const active = orders.filter(isOpenOrder);
  const past = orders.filter((o) => !isOpenOrder(o));
  const justPlaced = orders.find((o) => o.id === placedId);
  const storeOf = (order: Order) => stores.find((s) => s.id === order.storeId);

  return (
    <>
      <PageTitle title="My orders">Orders update here as the store works on them.</PageTitle>

      {justPlaced ? (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-ink bg-lime px-4 py-3 shadow-hard-sm" role="status">
          <PartyPopper className="mt-0.5 size-6 shrink-0" strokeWidth={2.5} />
          <p className="font-semibold">
            Order {justPlaced.code} is placed.
            {justPlaced.status === "placed" ? ` ${storeOf(justPlaced)?.name ?? "The store"} will confirm it shortly.` : ""}
          </p>
        </div>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState emoji="🧾" title="No orders yet">
          <Link href="/shop" className="font-bold text-ink underline underline-offset-4">
            Find a store and place your first one
          </Link>
        </EmptyState>
      ) : null}

      {active.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-2xl font-extrabold">In progress</h2>
          <div className="grid gap-5">
            {active.map((order) => (
              <OrderCard key={order.id} order={order} store={storeOf(order)} now={now} live />
            ))}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold">Past orders</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            {past.map((order) => (
              <OrderCard key={order.id} order={order} store={storeOf(order)} now={now} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function OrderCard({ order, store, now, live = false }: { order: Order; store?: Store; now: number; live?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-3">
        <EmojiTile emoji={store?.emoji ?? "🏪"} tint={store?.tint ?? "sky"} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-extrabold leading-tight">{store?.name ?? "Store"}</p>
          <p className="text-sm text-ink-soft">
            {order.code} · {dateTime(order.placedAt, now)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {live ? (
        <div className="mt-5">
          <OrderTracker order={order} />
          <p className="mt-3 text-sm font-semibold">{ORDER_STATUS[order.status].customerNote}</p>
        </div>
      ) : order.status === "rejected" ? (
        <p className="mt-3 text-sm font-semibold">{ORDER_STATUS.rejected.customerNote}</p>
      ) : null}

      <ul className="mt-4 grid gap-1 border-t-2 border-ink/10 pt-4 text-sm">
        {order.lines.map((line) => (
          <li key={line.productId} className="flex justify-between gap-3">
            <span>
              <span aria-hidden>{line.emoji} </span>
              {line.qty} × {line.name} <span className="text-ink-soft">({line.unit})</span>
            </span>
            <span className="tabular-nums">{inr(line.price * line.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t-2 border-ink/10 pt-3">
        <p className="min-w-0 text-sm text-ink-soft">
          To {order.address.label.toLowerCase()}: {addressLine(order.address)}
          <br />
          {order.payment === "upi" ? "UPI on delivery" : "Cash on delivery"}, including {inr(order.deliveryFee)} delivery
        </p>
        <p className="text-lg font-extrabold tabular-nums">{inr(order.total)}</p>
      </div>
    </Card>
  );
}
