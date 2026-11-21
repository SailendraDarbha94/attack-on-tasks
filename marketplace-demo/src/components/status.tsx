import { Bike, Check, CircleCheck, CircleX, Clock, Package, TriangleAlert, type LucideIcon } from "lucide-react";
import type { StockState } from "@/lib/db";
import { clock } from "@/lib/format";
import type { Order, OrderStatus, Tint } from "@/lib/types";
import { cx } from "./classes";
import { Badge } from "./ui";

// A status is never shown by colour alone: every badge carries an icon and a label.
export const ORDER_STATUS: Record<OrderStatus, { label: string; tint: Tint; icon: LucideIcon; customerNote: string }> = {
  placed: { label: "Placed", tint: "mango", icon: Clock, customerNote: "Waiting for the store to accept your order." },
  accepted: { label: "Accepted", tint: "sky", icon: Check, customerNote: "The store is picking your items." },
  packed: { label: "Packed", tint: "grape", icon: Package, customerNote: "Packed and waiting for a delivery partner." },
  out_for_delivery: { label: "Out for delivery", tint: "lime", icon: Bike, customerNote: "On the way to you." },
  delivered: { label: "Delivered", tint: "mint", icon: CircleCheck, customerNote: "Delivered. Enjoy!" },
  rejected: { label: "Rejected", tint: "tomato", icon: CircleX, customerNote: "The store could not take this order. You have not been charged." },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS[status];
  const Icon = meta.icon;
  return (
    <Badge tint={meta.tint}>
      <Icon className="size-3.5" strokeWidth={2.5} />
      {meta.label}
    </Badge>
  );
}

const TRACK: OrderStatus[] = ["placed", "accepted", "packed", "out_for_delivery", "delivered"];

/** The five steps of a delivery, with the time each one happened. */
export function OrderTracker({ order }: { order: Order }) {
  if (order.status === "rejected") return null;
  const reached = TRACK.indexOf(order.status);
  return (
    <ol className="grid grid-cols-5 gap-1">
      {TRACK.map((step, index) => {
        const done = index <= reached;
        const current = index === reached;
        const at = order.history.find((h) => h.status === step)?.at;
        const Icon = ORDER_STATUS[step].icon;
        return (
          <li key={step} className="flex flex-col items-center gap-1 text-center">
            <div className="flex w-full items-center">
              <span className={cx("h-0.5 flex-1", index === 0 ? "bg-transparent" : done ? "bg-ink" : "bg-ink/15")} />
              <span
                className={cx(
                  "grid size-8 place-items-center rounded-full border-2",
                  done ? "border-ink bg-lime text-ink" : "border-ink/20 bg-paper text-ink/35",
                  current && "ring-4 ring-lime/50",
                )}
              >
                <Icon className="size-4" strokeWidth={2.5} />
              </span>
              <span
                className={cx(
                  "h-0.5 flex-1",
                  index === TRACK.length - 1 ? "bg-transparent" : index < reached ? "bg-ink" : "bg-ink/15",
                )}
              />
            </div>
            <span className={cx("text-[11px] font-bold leading-tight sm:text-xs", !done && "text-ink/45")}>
              {ORDER_STATUS[step].label}
            </span>
            <span className="text-[11px] tabular-nums text-ink-soft">{at ? clock(at) : " "}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StockBadge({ state, stock }: { state: StockState; stock: number }) {
  if (state === "out") {
    return (
      <Badge tint="tomato">
        <CircleX className="size-3.5" strokeWidth={2.5} />
        Out of stock
      </Badge>
    );
  }
  if (state === "low") {
    return (
      <Badge tint="mango">
        <TriangleAlert className="size-3.5" strokeWidth={2.5} />
        Low: {stock} left
      </Badge>
    );
  }
  return (
    <Badge tint="mint">
      <Check className="size-3.5" strokeWidth={2.5} />
      In stock
    </Badge>
  );
}
