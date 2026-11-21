"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut, MapPin, ShoppingBasket } from "lucide-react";
import { Logo, Splash } from "@/components/brand";
import { ResetDemoButton } from "@/components/browser-app";
import { LegalLinks } from "@/components/legal";
import { cx } from "@/components/ui";
import { useDeliveryAddress, useRequireRole } from "@/lib/hooks";
import { cartCount, useCart } from "@/lib/session";
import type { Account } from "@/lib/types";

const NAV = [
  { href: "/shop", label: "Stores" },
  { href: "/orders", label: "My orders" },
  { href: "/account", label: "Account" },
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const account = useRequireRole("customer");
  if (!account) return <Splash />;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <CustomerHeader account={account} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t-2 border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-ink-soft sm:px-6">
          <p>Demo build. Shops, people and prices are made up.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <LegalLinks />
            <ResetDemoButton />
          </div>
        </div>
      </footer>
    </div>
  );
}

function CustomerHeader({ account }: { account: Account }) {
  const pathname = usePathname();
  const address = useDeliveryAddress(account);
  const count = useCart((s) => cartCount(s.lines));

  return (
    <header className="sticky top-0 z-20 border-b-2 border-ink bg-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Logo href="/shop" />

        <Link
          href="/account"
          className="order-last flex w-full min-w-0 items-center gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-1.5 text-sm shadow-hard-sm sm:order-none sm:w-auto sm:max-w-xs"
        >
          <MapPin className="size-4 shrink-0 text-tomato" strokeWidth={2.5} />
          <span className="truncate">
            {address ? (
              <>
                <span className="font-bold">{address.label}</span>
                <span className="text-ink-soft"> · {address.line1}, {address.area}</span>
              </>
            ) : (
              <span className="font-bold">Add a delivery address</span>
            )}
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1" aria-label="Main">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "hidden h-9 items-center rounded-xl px-3 text-sm font-bold md:inline-flex",
                  active ? "bg-ink text-white" : "hover:bg-ink/5",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/checkout"
            className="ml-1 inline-flex h-10 items-center gap-2 rounded-xl border-2 border-ink bg-lime px-3 text-sm font-extrabold shadow-hard-sm"
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <ShoppingBasket className="size-5" strokeWidth={2.5} />
            <span className="tabular-nums">{count}</span>
          </Link>
          <Link
            href="/signout"
            prefetch={false}
            className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold hover:bg-ink/5"
            title={`Signed in as ${account.name}`}
          >
            <LogOut className="size-4" strokeWidth={2.5} />
            <span className="hidden lg:inline">Sign out</span>
          </Link>
        </nav>
      </div>

      <nav className="flex gap-1 border-t-2 border-ink/10 px-4 py-2 md:hidden" aria-label="Sections">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex h-8 flex-1 items-center justify-center rounded-lg text-sm font-bold",
                active ? "bg-ink text-white" : "hover:bg-ink/5",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
