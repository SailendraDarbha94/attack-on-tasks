"use client";

import Link from "next/link";
import { ArrowRight, Bike, Clock, MapPin, Star } from "lucide-react";
import { Badge, cx, PageTitle, TINT_BG } from "@/components/ui";
import { useDb } from "@/lib/db";
import { inr } from "@/lib/format";
import { useAccount, useDeliveryAddress } from "@/lib/hooks";
import { cartCount, useCart } from "@/lib/session";
import type { Account } from "@/lib/types";

export default function StoresPage() {
  const account = useAccount();
  if (!account) return null;
  return <Stores account={account} />;
}

function Stores({ account }: { account: Account }) {
  const stores = useDb((s) => s.stores);
  const products = useDb((s) => s.products);
  const address = useDeliveryAddress(account);
  const cartStoreId = useCart((s) => s.storeId);
  const inCart = useCart((s) => cartCount(s.lines));
  const firstName = account.name.split(" ")[0];

  return (
    <>
      <PageTitle title={`Hi ${firstName}, what do you need today?`}>
        {address
          ? `Stores delivering to ${address.label.toLowerCase()} in ${address.area}.`
          : "Pick a store to start. We'll ask where to deliver when you check out."}
      </PageTitle>

      {!address ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-mango px-4 py-3 shadow-hard-sm">
          <p className="flex items-center gap-2 font-semibold">
            <MapPin className="size-5 shrink-0" strokeWidth={2.5} />
            You have no saved address yet. Add one now, or at checkout.
          </p>
          <Link href="/account" className="font-extrabold underline underline-offset-4">
            Add address
          </Link>
        </div>
      ) : null}

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => {
          const itemCount = products.filter((p) => p.storeId === store.id && p.active).length;
          return (
            <li key={store.id}>
              <Link
                href={`/shop/${store.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-ink bg-paper shadow-hard transition-transform hover:-translate-y-1"
              >
                <div className={cx("relative flex h-32 items-center justify-center border-b-2 border-ink", TINT_BG[store.tint])}>
                  <span aria-hidden className="text-6xl transition-transform group-hover:scale-110">
                    {store.emoji}
                  </span>
                  <Badge className="absolute left-3 top-3" tint={store.open ? "plain" : "tomato"}>
                    {store.open ? "Open now" : "Closed"}
                  </Badge>
                  {cartStoreId === store.id ? (
                    <Badge className="absolute right-3 top-3" tint="lime">
                      {inCart} in cart
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-2xl font-extrabold leading-tight">{store.name}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{store.tagline}</p>
                  <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Star className="size-4 fill-mango text-ink" strokeWidth={2} />
                      <dt className="sr-only">Rating</dt>
                      <dd>
                        {store.ratingCount > 0 ? `${store.rating.toFixed(1)} (${store.ratingCount.toLocaleString("en-IN")})` : "New"}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-4" strokeWidth={2.5} />
                      <dt className="sr-only">Delivery time</dt>
                      <dd>{store.deliveryMins} min</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bike className="size-4" strokeWidth={2.5} />
                      <dt className="sr-only">Delivery fee</dt>
                      <dd>{inr(store.deliveryFee)} delivery</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-sm text-ink-soft">
                    {store.area} · {itemCount} {itemCount === 1 ? "item" : "items"} · Min order {inr(store.minOrder)}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 font-extrabold">
                    Shop here
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
