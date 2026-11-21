"use client";

import { useMemo, useState } from "react";
import { OrderStatusBadge } from "@/components/status";
import { StoreOrderCard } from "@/components/store-order-card";
import { useStoreSession } from "@/components/store-context";
import { Card, EmptyState, PageTitle, Tabs } from "@/components/ui";
import { isOpenOrder, useDb } from "@/lib/db";
import { dateTime, inr } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import type { Order } from "@/lib/types";

type Tab = "current" | "past";

export default function StoreOrdersPage() {
  const { store } = useStoreSession();
  const allOrders = useDb((s) => s.orders);
  const now = useNow();
  const [tab, setTab] = useState<Tab>("current");

  const { waiting, inProgress, past } = useMemo(() => {
    const mine = allOrders.filter((o) => o.storeId === store.id);
    return {
      waiting: mine.filter((o) => o.status === "placed").sort((a, b) => a.placedAt - b.placedAt),
      inProgress: mine.filter((o) => isOpenOrder(o) && o.status !== "placed").sort((a, b) => a.placedAt - b.placedAt),
      past: mine.filter((o) => !isOpenOrder(o)).sort((a, b) => b.placedAt - a.placedAt),
    };
  }, [allOrders, store.id]);

  const currentCount = waiting.length + inProgress.length;

  return (
    <>
      <PageTitle title="Orders">Accept new orders, move them along, and look back at past ones.</PageTitle>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "current", label: "Current", count: currentCount },
          { id: "past", label: "Past", count: past.length },
        ]}
      />

      <div className="mt-6">
        {tab === "current" ? (
          currentCount === 0 ? (
            <EmptyState emoji="🛎️" title="No orders on the go">
              When a customer places an order it shows up here straight away.
            </EmptyState>
          ) : (
            <div className="grid gap-8">
              <OrderGroup title="New, waiting for you" orders={waiting} now={now} />
              <OrderGroup title="In progress" orders={inProgress} now={now} />
            </div>
          )
        ) : past.length === 0 ? (
          <EmptyState emoji="🗂️" title="No past orders yet">
            Delivered and rejected orders are kept here.
          </EmptyState>
        ) : (
          <PastOrders orders={past} now={now} />
        )}
      </div>
    </>
  );
}

function OrderGroup({ title, orders, now }: { title: string; orders: Order[]; now: number }) {
  if (orders.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-extrabold">
        {title} <span className="text-ink-soft">({orders.length})</span>
      </h2>
      <div className="grid gap-4 xl:grid-cols-2">
        {orders.map((order) => (
          <StoreOrderCard key={order.id} order={order} now={now} />
        ))}
      </div>
    </section>
  );
}

function PastOrders({ orders, now }: { orders: Order[]; now: number }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left text-xs uppercase tracking-wide text-ink-soft">
            <th className="px-4 py-3 font-bold">Order</th>
            <th className="px-4 py-3 font-bold">Placed</th>
            <th className="px-4 py-3 font-bold">Customer</th>
            <th className="px-4 py-3 font-bold">Items</th>
            <th className="px-4 py-3 text-right font-bold">Total</th>
            <th className="px-4 py-3 font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-ink/10 last:border-0">
              <td className="px-4 py-3 font-bold">{order.code}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{dateTime(order.placedAt, now)}</td>
              <td className="px-4 py-3">
                {order.customerName}
                <span className="block text-xs text-ink-soft">{order.address.area}</span>
              </td>
              <td className="max-w-64 truncate px-4 py-3 text-ink-soft" title={order.lines.map((l) => `${l.qty} × ${l.name}`).join(", ")}>
                {order.lines.map((l) => `${l.qty} × ${l.name}`).join(", ")}
              </td>
              <td className="px-4 py-3 text-right font-bold tabular-nums">{inr(order.total)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
