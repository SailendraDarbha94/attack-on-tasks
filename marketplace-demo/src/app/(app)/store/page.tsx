"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { SalesChart, type DayPoint } from "@/components/sales-chart";
import { StockBadge } from "@/components/status";
import { StoreOrderCard } from "@/components/store-order-card";
import { useStoreSession } from "@/components/store-context";
import { buttonClass, Card, CATEGORY_TINT, cx, EmojiTile, EmptyState, PageTitle } from "@/components/ui";
import { stockState, useDb } from "@/lib/db";
import { DAY, inr, startOfDay, timeAgo, weekday } from "@/lib/format";
import { useNow } from "@/lib/hooks";

function greeting(now: number): string {
  const hour = new Date(now).getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Change against yesterday, as a whole percentage. Null when there is nothing to compare with. */
function change(today: number, yesterday: number): number | null {
  if (yesterday <= 0) return null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

export default function StoreOverviewPage() {
  const { account, store } = useStoreSession();
  const allOrders = useDb((s) => s.orders);
  const allProducts = useDb((s) => s.products);
  const now = useNow();

  const view = useMemo(() => {
    const orders = allOrders.filter((o) => o.storeId === store.id);
    const counted = orders.filter((o) => o.status !== "rejected");
    const today = startOfDay(now);
    const sum = (list: typeof counted) => list.reduce((total, o) => total + o.total, 0);

    const todays = counted.filter((o) => o.placedAt >= today);
    // Compare with yesterday up to the same time of day, so a morning is not judged against a full day.
    const yesterdays = counted.filter((o) => o.placedAt >= today - DAY && o.placedAt <= now - DAY);

    const days: DayPoint[] = Array.from({ length: 7 }, (_, i) => {
      const start = today - (6 - i) * DAY;
      const inDay = counted.filter((o) => o.placedAt >= start && o.placedAt < start + DAY);
      return {
        ts: start,
        label: i === 6 ? "Today" : weekday(start),
        full: new Date(start).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
        value: sum(inDay),
        orders: inDay.length,
      };
    });

    const sold = new Map<string, { name: string; emoji: string; units: number }>();
    for (const order of counted) {
      if (order.placedAt < today - 6 * DAY) continue;
      for (const line of order.lines) {
        const entry = sold.get(line.productId) ?? { name: line.name, emoji: line.emoji, units: 0 };
        entry.units += line.qty;
        sold.set(line.productId, entry);
      }
    }

    const products = allProducts.filter((p) => p.storeId === store.id);
    return {
      todayCount: todays.length,
      todaySales: sum(todays),
      countChange: change(todays.length, yesterdays.length),
      salesChange: change(sum(todays), sum(yesterdays)),
      days,
      waiting: orders.filter((o) => o.status === "placed").sort((a, b) => a.placedAt - b.placedAt),
      lowStock: products.filter((p) => stockState(p) !== "ok").sort((a, b) => a.stock - b.stock),
      outCount: products.filter((p) => stockState(p) === "out").length,
      productCount: products.length,
      topSellers: [...sold.entries()]
        .map(([id, entry]) => ({ id, ...entry }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5),
    };
  }, [allOrders, allProducts, store.id, now]);

  const lowCount = view.lowStock.length - view.outCount;
  const topUnits = view.topSellers[0]?.units ?? 0;

  return (
    <>
      <PageTitle title={`${greeting(now)}, ${account.name.split(" ")[0]}`}>
        Here&apos;s how {store.name} is doing today.
      </PageTitle>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Orders today" value={String(view.todayCount)} change={view.countChange} />
        <StatTile label="Sales today" value={inr(view.todaySales)} change={view.salesChange} />
        <StatTile
          label="Waiting for you"
          value={String(view.waiting.length)}
          note={view.waiting.length > 0 ? `Oldest placed ${timeAgo(view.waiting[0].placedAt, now)}` : "All caught up"}
          highlight={view.waiting.length > 0}
        />
        <StatTile
          label="Running low"
          value={String(view.lowStock.length)}
          note={view.lowStock.length > 0 ? `${lowCount} low, ${view.outCount} out of stock` : "Shelves look healthy"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="p-5">
          <h2 className="font-display text-xl font-extrabold">Sales, last 7 days</h2>
          <p className="text-sm text-ink-soft">Order value per day, rejected orders left out.</p>
          <div className="mt-2">
            <SalesChart days={view.days} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-xl font-extrabold">Top sellers this week</h2>
          <p className="text-sm text-ink-soft">Units sold in the last 7 days.</p>
          {view.topSellers.length === 0 ? (
            <p className="mt-6 text-sm text-ink-soft">No sales yet. Your first orders will show up here.</p>
          ) : (
            <ol className="mt-4 grid gap-3">
              {view.topSellers.map((item) => (
                <li key={item.id} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
                  <span className="truncate font-semibold">
                    <span aria-hidden>{item.emoji} </span>
                    {item.name}
                  </span>
                  <span className="h-2 rounded-full bg-grape-soft">
                    <span
                      className="block h-2 rounded-full bg-grape"
                      style={{ width: `${topUnits > 0 ? Math.max(4, (item.units / topUnits) * 100) : 0}%` }}
                    />
                  </span>
                  <span className="text-right font-bold tabular-nums">{item.units}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold">New orders</h2>
            <Link href="/store/orders" className="inline-flex items-center gap-1 text-sm font-bold hover:underline">
              All orders
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
          </div>
          {view.waiting.length === 0 ? (
            <EmptyState emoji="✅" title="Nothing waiting">
              New orders land here the moment a customer places them.
            </EmptyState>
          ) : (
            <div className="grid gap-4">
              {view.waiting.slice(0, 3).map((order) => (
                <StoreOrderCard key={order.id} order={order} now={now} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold">Stock to top up</h2>
            <Link href="/store/inventory" className="inline-flex items-center gap-1 text-sm font-bold hover:underline">
              Inventory
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
          </div>
          {view.productCount === 0 ? (
            <EmptyState emoji="📦" title="No products yet">
              <Link href="/store/inventory" className={buttonClass("accent", "sm", "mt-2")}>
                Add your first product
              </Link>
            </EmptyState>
          ) : view.lowStock.length === 0 ? (
            <EmptyState emoji="🧺" title="Everything is stocked" />
          ) : (
            <Card className="divide-y-2 divide-ink/10">
              {view.lowStock.slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3">
                  <EmojiTile emoji={product.emoji} tint={CATEGORY_TINT[product.category]} className="size-10 text-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{product.name}</p>
                    <p className="text-xs text-ink-soft">{product.unit}</p>
                  </div>
                  <StockBadge state={stockState(product)} stock={product.stock} />
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </>
  );
}

function StatTile({
  label,
  value,
  change: delta,
  note,
  highlight = false,
}: {
  label: string;
  value: string;
  change?: number | null;
  note?: string;
  highlight?: boolean;
}) {
  const up = (delta ?? 0) >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className={cx("p-4", highlight && "bg-mango")}>
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-1 text-4xl font-semibold leading-none">{value}</p>
      <p className="mt-3 flex min-h-6 items-center gap-1.5 text-xs font-semibold text-ink-soft">
        {delta !== undefined && delta !== null ? (
          <>
            <span
              className={cx(
                "inline-flex items-center gap-0.5 rounded-full border-2 border-ink px-1.5 py-px font-bold text-ink",
                up ? "bg-mint-soft" : "bg-tomato-soft",
              )}
            >
              <Arrow className="size-3.5" strokeWidth={3} />
              {Math.abs(delta)}%
            </span>
            vs this time yesterday
          </>
        ) : delta === null ? (
          "No orders by this time yesterday"
        ) : (
          note
        )}
      </p>
    </Card>
  );
}
