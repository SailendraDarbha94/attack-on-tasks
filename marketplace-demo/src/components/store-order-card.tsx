"use client";

import { MapPin, Phone } from "lucide-react";
import { useDb } from "@/lib/db";
import { addressLine, clock, inr, timeAgo } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { OrderStatusBadge } from "./status";
import { Button, Card } from "./ui";

/** What the store does next with an order in each state. */
export const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  placed: { to: "accepted", label: "Accept order" },
  accepted: { to: "packed", label: "Mark as packed" },
  packed: { to: "out_for_delivery", label: "Hand to delivery partner" },
  out_for_delivery: { to: "delivered", label: "Mark as delivered" },
};

export function StoreOrderCard({ order, now }: { order: Order; now: number }) {
  const setOrderStatus = useDb((s) => s.setOrderStatus);
  const next = NEXT_STEP[order.status];
  const units = order.lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <Card className="flex flex-col p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="font-display text-xl font-extrabold">{order.code}</h3>
        <OrderStatusBadge status={order.status} />
        <p className="ml-auto text-sm text-ink-soft">
          {timeAgo(order.placedAt, now)} · {clock(order.placedAt)}
        </p>
      </div>

      <div className="mt-3 grid gap-1 text-sm">
        <p className="flex flex-wrap items-center gap-x-3 font-bold">
          {order.customerName}
          <span className="inline-flex items-center gap-1 font-medium text-ink-soft">
            <Phone className="size-3.5" strokeWidth={2.5} />
            {order.customerPhone}
          </span>
        </p>
        <p className="flex items-start gap-1.5 text-ink-soft">
          <MapPin className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} />
          {addressLine(order.address)}
        </p>
      </div>

      <ul className="mt-3 grid gap-1 border-t-2 border-ink/10 pt-3 text-sm">
        {order.lines.map((line) => (
          <li key={line.productId} className="flex justify-between gap-3">
            <span>
              <span aria-hidden>{line.emoji} </span>
              <span className="font-bold">{line.qty} ×</span> {line.name}{" "}
              <span className="text-ink-soft">({line.unit})</span>
            </span>
            <span className="tabular-nums">{inr(line.price * line.qty)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
        <p className="text-sm">
          <span className="text-lg font-extrabold tabular-nums">{inr(order.total)}</span>
          <span className="text-ink-soft">
            {" "}
            · {units} {units === 1 ? "item" : "items"} · {order.payment === "upi" ? "UPI" : "Cash"} on delivery
          </span>
        </p>
        {next ? (
          <div className="flex flex-wrap gap-2">
            {order.status === "placed" ? (
              <Button variant="danger" size="sm" onClick={() => setOrderStatus(order.id, "rejected")}>
                Reject
              </Button>
            ) : null}
            <Button variant={order.status === "placed" ? "accent" : "primary"} size="sm" onClick={() => setOrderStatus(order.id, next.to)}>
              {next.label}
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
