"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, MapPin, Plus, Smartphone } from "lucide-react";
import { AddressForm } from "@/components/address-form";
import { CartLines, useCartSummary } from "@/components/cart";
import { Badge, Button, buttonClass, Card, cx, EmptyState, FormError, PageTitle } from "@/components/ui";
import { useDb } from "@/lib/db";
import { addressLine, inr } from "@/lib/format";
import { useAccount, useDeliveryAddress } from "@/lib/hooks";
import { useCart } from "@/lib/session";
import type { Account, PaymentMethod } from "@/lib/types";

const PAYMENTS: { id: PaymentMethod; label: string; note: string; icon: typeof Banknote }[] = [
  { id: "upi", label: "UPI on delivery", note: "Scan the delivery partner's QR code", icon: Smartphone },
  { id: "cod", label: "Cash on delivery", note: "Keep change handy", icon: Banknote },
];

export default function CheckoutPage() {
  const account = useAccount();
  if (!account) return null;
  return <Checkout account={account} />;
}

function Checkout({ account }: { account: Account }) {
  const router = useRouter();
  const cart = useCartSummary();
  const address = useDeliveryAddress(account);
  const setAddress = useCart((s) => s.setAddress);
  const clearCart = useCart((s) => s.clear);
  const addAddress = useDb((s) => s.addAddress);
  const placeOrder = useDb((s) => s.placeOrder);
  const [adding, setAdding] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("upi");
  const [error, setError] = useState("");

  const { store } = cart;
  if (!store || cart.items.length === 0) {
    return (
      <EmptyState emoji="🧺" title="Your cart is empty">
        <Link href="/shop" className="font-bold text-ink underline underline-offset-4">
          Browse stores
        </Link>
      </EmptyState>
    );
  }

  const noAddresses = account.addresses.length === 0;
  const showForm = noAddresses || adding;
  const belowMinimum = cart.subtotal < store.minOrder;
  const total = cart.subtotal + store.deliveryFee;
  const blocked = !address
    ? "Add a delivery address to place your order."
    : !store.open
      ? `${store.name} is closed right now.`
      : cart.count === 0
        ? "Nothing in your cart is in stock any more."
        : belowMinimum
          ? `Add ${inr(store.minOrder - cart.subtotal)} more to reach ${store.name}'s minimum order of ${inr(store.minOrder)}.`
          : "";

  function submit() {
    if (!address || !store || blocked) return;
    const order = placeOrder({
      storeId: store.id,
      customer: account,
      address,
      lines: cart.items.map((item) => ({ productId: item.product.id, qty: item.payable })),
      payment,
    });
    if (!order) {
      setError("We couldn't place that order. Check your cart and try again.");
      return;
    }
    clearCart();
    router.push(`/orders?placed=${order.id}`);
  }

  return (
    <>
      <PageTitle title="Checkout">Ordering from {store.name}.</PageTitle>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-6">
          <Card className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <MapPin className="size-6 text-tomato" strokeWidth={2.5} />
              Where should we deliver?
            </h2>

            {noAddresses ? (
              <p className="mt-2 rounded-xl border-2 border-ink bg-mango px-3 py-2 font-semibold">
                You don&apos;t have a saved address yet. Add one to place this order.
              </p>
            ) : (
              <fieldset className="mt-4 grid gap-3">
                <legend className="sr-only">Saved addresses</legend>
                {account.addresses.map((option) => {
                  const selected = address?.id === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cx(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-ink p-4",
                        selected ? "bg-lime shadow-hard-sm" : "bg-paper hover:bg-ink/5",
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="mt-1 size-4 accent-ink"
                        checked={selected}
                        onChange={() => setAddress(option.id)}
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 font-bold">
                          {option.label}
                          <span className="text-sm font-medium text-ink-soft">
                            {option.recipient} · {option.phone}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm">{addressLine(option)}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}

            {showForm ? (
              <div className={cx("mt-5", !noAddresses && "border-t-2 border-ink/10 pt-5")}>
                {!noAddresses ? <h3 className="mb-3 font-bold">New address</h3> : null}
                <AddressForm
                  defaultRecipient={account.name}
                  defaultPhone={account.phone}
                  submitLabel="Save and deliver here"
                  onCancel={noAddresses ? undefined : () => setAdding(false)}
                  onSave={(input) => {
                    const saved = addAddress(account.id, input);
                    setAddress(saved.id);
                    setAdding(false);
                  }}
                />
              </div>
            ) : (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setAdding(true)}>
                <Plus className="size-4" strokeWidth={3} />
                Add a new address
              </Button>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-2xl font-extrabold">How will you pay?</h2>
            <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Payment method</legend>
              {PAYMENTS.map((option) => {
                const selected = payment === option.id;
                const Icon = option.icon;
                return (
                  <label
                    key={option.id}
                    className={cx(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-ink p-4",
                      selected ? "bg-lime shadow-hard-sm" : "bg-paper hover:bg-ink/5",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      className="mt-1 size-4 accent-ink"
                      checked={selected}
                      onChange={() => setPayment(option.id)}
                    />
                    <span>
                      <span className="flex items-center gap-2 font-bold">
                        <Icon className="size-4" strokeWidth={2.5} />
                        {option.label}
                      </span>
                      <span className="block text-sm text-ink-soft">{option.note}</span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
            <p className="mt-3 text-sm text-ink-soft">This is a demo, so no payment is taken.</p>
          </Card>
        </div>

        <aside>
          <Card className="sticky top-24 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold">Your order</h2>
              <Badge tint={store.tint}>
                {store.emoji} {store.name}
              </Badge>
            </div>
            <div className="mt-4">
              <CartLines items={cart.items} />
            </div>
            <dl className="mt-4 grid gap-1.5 border-t-2 border-ink/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Item total</dt>
                <dd className="font-bold tabular-nums">{inr(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery fee</dt>
                <dd className="font-bold tabular-nums">{inr(store.deliveryFee)}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t-2 border-ink/10 pt-2 text-lg font-extrabold">
                <dt>To pay</dt>
                <dd className="tabular-nums">{inr(total)}</dd>
              </div>
            </dl>
            {blocked ? <p className="mt-3 text-sm font-semibold text-ink-soft">{blocked}</p> : null}
            <div className="mt-3">
              <FormError>{error}</FormError>
            </div>
            <Button variant="accent" size="lg" className="mt-3 w-full" disabled={Boolean(blocked)} onClick={submit}>
              Place order · {inr(total)}
            </Button>
            <Link href={`/shop/${store.id}`} className={buttonClass("quiet", "sm", "mt-2 w-full")}>
              Add more items
            </Link>
          </Card>
        </aside>
      </div>
    </>
  );
}
