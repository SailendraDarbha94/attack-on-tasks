"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { Boxes, ClipboardList, LayoutDashboard, LogOut, Truck, type LucideIcon } from "lucide-react";
import { Logo, Splash } from "@/components/brand";
import { ResetDemoButton } from "@/components/browser-app";
import { StoreContext } from "@/components/store-context";
import { cx, EmojiTile } from "@/components/ui";
import { stockState, useDb } from "@/lib/db";
import { useMyStore, useRequireRole } from "@/lib/hooks";
import type { Store } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  countLabel?: string;
}

export default function StoreLayout({ children }: { children: ReactNode }) {
  const account = useRequireRole("store");
  const store = useMyStore(account);
  const session = useMemo(() => (account && store ? { account, store } : null), [account, store]);
  if (!session) return <Splash />;

  return (
    <StoreContext value={session}>
      <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
        <Sidebar store={session.store} ownerName={session.account.name} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </StoreContext>
  );
}

function Sidebar({ store, ownerName }: { store: Store; ownerName: string }) {
  const pathname = usePathname();
  const orders = useDb((s) => s.orders);
  const products = useDb((s) => s.products);
  const setStoreOpen = useDb((s) => s.setStoreOpen);

  const newOrders = orders.filter((o) => o.storeId === store.id && o.status === "placed").length;
  const lowStock = products.filter((p) => p.storeId === store.id && stockState(p) !== "ok").length;

  const nav: NavItem[] = [
    { href: "/store", label: "Overview", icon: LayoutDashboard },
    { href: "/store/orders", label: "Orders", icon: ClipboardList, count: newOrders, countLabel: "new" },
    { href: "/store/inventory", label: "Inventory", icon: Boxes, count: lowStock, countLabel: "low or out of stock" },
    { href: "/store/vendors", label: "Vendors", icon: Truck },
  ];

  return (
    <aside className="flex shrink-0 flex-col gap-4 border-b-2 border-ink bg-ink p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r-2 lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <Logo href="/store" onDark />
        <Link
          href="/signout"
          prefetch={false}
          className="inline-flex h-9 items-center gap-2 rounded-xl px-2 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <LogOut className="size-4" strokeWidth={2.5} />
          Sign out
        </Link>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
        <EmojiTile emoji={store.emoji} tint={store.tint} className="size-11 text-2xl" />
        <div className="min-w-0">
          <p className="font-bold leading-tight">{store.name}</p>
          <p className="truncate text-sm text-white/65">{store.area}</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Store">
        {nav.map((item) => {
          const active = item.href === "/store" ? pathname === "/store" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 font-bold",
                active ? "bg-lime text-ink" : "text-white/85 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="size-5" strokeWidth={2.25} />
              {item.label}
              {item.count ? (
                <span
                  className={cx(
                    "ml-auto rounded-full px-2 py-0.5 text-xs tabular-nums",
                    active ? "bg-ink text-white" : "bg-lime text-ink",
                  )}
                >
                  {item.count}
                  <span className="sr-only"> {item.countLabel}</span>
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-4">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white/10 p-3">
          <span>
            <span className="block text-sm font-bold">{store.open ? "Accepting orders" : "Closed to orders"}</span>
            <span className="block text-xs text-white/65">Customers see this right away</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="peer sr-only"
            checked={store.open}
            onChange={(event) => setStoreOpen(store.id, event.target.checked)}
          />
          <span
            aria-hidden
            className="relative h-7 w-12 shrink-0 rounded-full border-2 border-white/60 bg-white/15 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:border-lime peer-checked:bg-lime peer-checked:after:translate-x-5 peer-checked:after:bg-ink peer-focus-visible:ring-4 peer-focus-visible:ring-grape/60"
          />
        </label>
        <div className="hidden items-center justify-between gap-3 lg:flex">
          <span className="truncate text-sm text-white/65">{ownerName}</span>
          <Link
            href="/signout"
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-white/80 hover:text-white"
          >
            <LogOut className="size-4" strokeWidth={2.5} />
            Sign out
          </Link>
        </div>
        <div className="hidden lg:block">
          <ResetDemoButton onDark />
        </div>
      </div>
    </aside>
  );
}
