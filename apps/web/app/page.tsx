import { formatDistance, formatPaise, type StoreSummary } from "@nukkad/core";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { getStores } from "@/lib/api";
import { SITE } from "@/lib/site";

const STEPS = [
  {
    emoji: "📍",
    title: "We find your nearest store",
    body: "Share your location or pick your area. Nukkad opens the store closest to you, so what you see is what is on its shelf right now.",
  },
  {
    emoji: "🧺",
    title: "Fill your cart",
    body: "Fruit and vegetables, milk, atta and dal, snacks, cleaning and personal care. Prices at or below the MRP, with no surprises at checkout.",
  },
  {
    emoji: "🛵",
    title: "At your door in minutes",
    body: "Add your address, pay on delivery by cash or UPI, and watch the order go from packed to on its way.",
  },
];

const SHELF = [
  { emoji: "🍅", name: "Tomato", unit: "500 g", price: 3000, tint: "#E6F4D7" },
  { emoji: "🥛", name: "Toned milk", unit: "500 ml", price: 2800, tint: "#E3EEFB" },
  { emoji: "🍞", name: "Sandwich bread", unit: "400 g", price: 4500, tint: "#FBF0D0" },
  { emoji: "🥚", name: "Eggs", unit: "6 pcs", price: 5400, tint: "#FDE5D2" },
];

export default function HomePage() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-semibold text-ink-soft sm:flex">
          <a href="#how" className="hover:text-ink">
            How it works
          </a>
          <a href="#stores" className="hover:text-ink">
            Stores
          </a>
          <a href="#partners" className="hover:text-ink">
            For store owners
          </a>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-tomato-soft px-3.5 py-1.5 text-sm font-bold text-tomato-dark">
              <span aria-hidden="true">●</span> Now delivering in {SITE.city}
            </p>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
              Your corner store, at your door <span className="text-tomato">in minutes.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{SITE.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-2xl bg-ink px-6 py-3.5 font-semibold text-white">App coming soon to iOS and Android</span>
              <a href="#how" className="rounded-2xl border border-line bg-paper px-6 py-3.5 font-semibold hover:bg-sand">
                See how it works
              </a>
            </div>
          </div>

          {/* A picture of the app's shop screen, drawn in HTML so it stays sharp and needs no image. */}
          <div aria-hidden="true" className="mx-auto w-full max-w-sm rounded-[2.2rem] border border-line bg-paper p-5 shadow-lift">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-soft">Delivery in</p>
            <p className="font-display text-3xl font-extrabold">14 minutes</p>
            <div className="mt-3 rounded-2xl border border-line px-3.5 py-2.5 text-sm">
              <p className="font-semibold">📍 Home · Jayanagar</p>
              <p className="text-xs text-ink-soft">From Nukkad Jayanagar · 520 m away</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {SHELF.map((item) => (
                <div key={item.name} className="rounded-2xl bg-paper p-2 shadow-card">
                  <div className="grid h-20 place-items-center rounded-xl text-4xl" style={{ backgroundColor: item.tint }}>
                    {item.emoji}
                  </div>
                  <p className="mt-2 px-1 text-sm font-semibold">{item.name}</p>
                  <p className="px-1 text-xs text-ink-soft">{item.unit}</p>
                  <div className="mt-1.5 flex items-center justify-between px-1 pb-1">
                    <span className="font-semibold">{formatPaise(item.price)}</span>
                    <span className="rounded-lg border-[1.5px] border-tomato px-3 py-1 text-xs font-bold text-tomato">ADD</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white">
              <span className="font-semibold">₹157 · 4 items</span>
              <span className="font-semibold">View cart ›</span>
            </div>
          </div>
        </section>

        <section id="how" className="border-y border-line bg-paper">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <h2 className="font-display text-4xl font-extrabold tracking-tight">How it works</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-3xl bg-cream p-7">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl" aria-hidden="true">
                      {step.emoji}
                    </span>
                    <span className="font-display text-5xl font-extrabold text-line">{index + 1}</span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-extrabold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="stores" className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">Where we deliver</h2>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">
            Each store delivers to the neighbourhoods around it. The app picks the right one for your address.
          </p>
          <Suspense fallback={<p className="mt-10 text-ink-soft">Loading stores…</p>}>
            <Stores />
          </Suspense>
        </section>

        <section id="partners" className="mx-auto w-full max-w-6xl px-5 pb-24">
          <div className="grid items-center gap-8 rounded-[2rem] bg-ink p-8 text-white sm:p-12 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <h2 className="font-display text-4xl font-extrabold tracking-tight">Run a store?</h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/75">
                The same app is your counter. New orders arrive by themselves; accept, pack and send them out with a tap. Change a
                price or mark something sold out and customers see it straight away.
              </p>
            </div>
            <ul className="grid gap-3 text-base font-semibold">
              {["Live order queue", "Stock and prices in your pocket", "Open and close with one switch"].map((point) => (
                <li key={point} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                  <span className="text-mango" aria-hidden="true">
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-ink-soft">
          <p>
            {SITE.name}, {SITE.city}. Pre-launch build: stores and prices shown are sample data.
          </p>
        </div>
      </footer>
    </>
  );
}

async function Stores() {
  const stores = await getStores();
  if (stores.length === 0) {
    return (
      <p className="mt-10 rounded-3xl border border-line bg-paper p-7 text-ink-soft">
        The store list is not available right now. Please check back in a little while.
      </p>
    );
  }
  return (
    <ul className="mt-10 grid gap-6 md:grid-cols-2">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </ul>
  );
}

function StoreCard({ store }: { store: StoreSummary }) {
  const facts = [
    { label: "Delivers within", value: formatDistance(store.deliveryRadiusM) },
    { label: "Delivery", value: formatPaise(store.deliveryFeePaise) },
    {
      label: "Free delivery",
      value: store.freeDeliveryAbovePaise === null ? "Not offered" : `Above ${formatPaise(store.freeDeliveryAbovePaise)}`,
    },
    { label: "Minimum order", value: formatPaise(store.minOrderPaise) },
  ];
  return (
    <li className="rounded-3xl bg-paper p-7 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-extrabold">{store.name}</h3>
          <p className="mt-1 text-ink-soft">{store.addressText}</p>
        </div>
        <span
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
            store.isOpen ? "bg-leaf-soft text-leaf" : "bg-sand text-ink-soft"
          }`}>
          {store.isOpen ? "Open now" : "Closed"}
        </span>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-xs font-bold uppercase tracking-wider text-ink-soft">{fact.label}</dt>
            <dd className="mt-0.5 text-lg font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
