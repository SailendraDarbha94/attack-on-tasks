import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { BRAND, BRAND_MEANING, Logo } from "@/components/brand";
import { ResetDemoButton } from "@/components/browser-app";
import { buttonClass } from "@/components/classes";
import { LegalLinks } from "@/components/legal";

const STICKERS = [
  { emoji: "🍅", bg: "bg-lime", tilt: "-rotate-6" },
  { emoji: "🥛", bg: "bg-sky", tilt: "rotate-3" },
  { emoji: "🥭", bg: "bg-mango", tilt: "-rotate-3" },
  { emoji: "🍞", bg: "bg-cream", tilt: "rotate-6" },
  { emoji: "🧼", bg: "bg-berry", tilt: "-rotate-2" },
  { emoji: "🥬", bg: "bg-mint", tilt: "rotate-2" },
];

const ROLES = [
  {
    href: "/login?role=customer",
    emoji: "🛍️",
    title: "I'm here to shop",
    blurb: "Order groceries and essentials from stores around you.",
    points: ["Browse neighbourhood stores", "Pick a saved address, or add a new one", "Track your order as it moves"],
    cta: "Continue as a customer",
    card: "bg-lime text-ink",
    button: buttonClass("primary", "lg", "w-full sm:w-auto"),
    tick: "bg-ink text-lime",
  },
  {
    href: "/login?role=store",
    emoji: "🏪",
    title: "I run a store",
    blurb: "Take orders and keep your shelves and suppliers in order.",
    points: ["See new, current and past orders", "Add products and update stock", "Manage vendors and find new ones"],
    cta: "Continue as a store",
    card: "bg-ink text-white",
    button: buttonClass("lime", "lg", "w-full sm:w-auto"),
    tick: "bg-lime text-ink",
  },
];

const STEPS = [
  { n: "1", bg: "bg-mango", text: "Open this demo in two browser tabs." },
  { n: "2", bg: "bg-sky", text: "Sign in as a customer in one, and as a store in the other." },
  { n: "3", bg: "bg-berry", text: "Place an order and watch it land on the store's dashboard." },
];

export default function LandingPage() {
  return (
    <>
      <header className="border-b-2 border-ink bg-cream">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/login" className={buttonClass("outline", "sm")}>
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b-2 border-ink bg-tomato">
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
            <p className="inline-flex -rotate-1 items-center rounded-full border-2 border-ink bg-cream px-3 py-1 text-sm font-bold shadow-hard-sm">
              Demo build · made-up shops and prices
            </p>
            <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.75rem,8vw,5.75rem)] font-extrabold leading-[0.95] tracking-tight text-white">
              Your corner store, at your door.
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium text-ink sm:text-xl">
              Order from the neighbourhood shops you already trust. Or run your own shop&apos;s orders, stock and
              suppliers from one screen.
            </p>
            <div aria-hidden className="mt-10 flex flex-wrap gap-3 sm:gap-4">
              {STICKERS.map((sticker) => (
                <span
                  key={sticker.emoji}
                  className={`grid size-16 place-items-center rounded-2xl border-2 border-ink text-3xl shadow-hard sm:size-20 sm:text-4xl ${sticker.bg} ${sticker.tilt}`}
                >
                  {sticker.emoji}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Who&apos;s visiting today?</h2>
          <p className="mt-2 text-ink-soft">Pick a side. You can switch any time.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {ROLES.map((role) => (
              <Link
                key={role.href}
                href={role.href}
                className={`group flex flex-col rounded-3xl border-2 border-ink p-6 shadow-hard-lg transition-transform hover:-translate-y-1 sm:p-8 ${role.card}`}
              >
                <span aria-hidden className="text-5xl">
                  {role.emoji}
                </span>
                <h3 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">{role.title}</h3>
                <p className="mt-2 text-lg opacity-85">{role.blurb}</p>
                <ul className="mb-8 mt-5 grid gap-2.5">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-center gap-3 font-semibold">
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full ${role.tick}`}>
                        <Check className="size-3.5" strokeWidth={3.5} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <span className={`mt-auto ${role.button}`}>
                  {role.cta}
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y-2 border-ink bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">See both sides at once</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n} className="flex items-start gap-4 rounded-2xl border-2 border-ink bg-cream p-4 shadow-hard-sm">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink font-display text-xl font-extrabold ${step.bg}`}
                  >
                    {step.n}
                  </span>
                  <p className="pt-1.5 font-semibold">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="bg-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            {BRAND_MEANING} Every shop, person and price in this {BRAND} demo is made up, and your changes stay in
            this browser.
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2">
            <LegalLinks />
            <ResetDemoButton />
          </div>
        </div>
      </footer>
    </>
  );
}
