"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Info } from "lucide-react";
import { homeFor } from "@/lib/auth";
import { useAccount } from "@/lib/hooks";
import type { Role } from "@/lib/types";
import { Logo } from "./brand";
import { LegalLinks } from "./legal";
import { cx } from "./ui";

const PANEL: Record<Role, { bg: string; emoji: string; headline: string; lines: string[] }> = {
  customer: {
    bg: "bg-lime text-ink",
    emoji: "🛍️",
    headline: "Groceries from shops you know.",
    lines: ["Three neighbourhood stores to order from", "Saved addresses, or add one at checkout", "Live order tracking"],
  },
  store: {
    bg: "bg-ink text-white",
    emoji: "🏪",
    headline: "Your shop, on one screen.",
    lines: ["Orders as they come in", "Stock and prices you can edit in seconds", "Vendors, purchase orders and new suppliers"],
  },
};

export function useAuthRole(): Role {
  return useSearchParams().get("role") === "store" ? "store" : "customer";
}

/** Sends anyone who is already signed in to their own side of the product. */
export function useRedirectIfSignedIn() {
  const account = useAccount();
  const router = useRouter();
  useEffect(() => {
    if (account) router.replace(homeFor(account.role));
  }, [account, router]);
}

export function AuthShell({ role, title, children }: { role: Role; title: string; children: ReactNode }) {
  const pathname = usePathname();
  const panel = PANEL[role];

  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className={cx("hidden flex-col justify-between border-r-2 border-ink p-10 lg:flex", panel.bg)}>
        <Logo onDark={role === "store"} />
        <div>
          <span aria-hidden className="text-6xl">
            {panel.emoji}
          </span>
          <h2 className="mt-6 font-display text-5xl font-extrabold leading-[1.02]">{panel.headline}</h2>
          <ul className="mt-6 grid gap-2 text-lg font-semibold opacity-90">
            {panel.lines.map((line) => (
              <li key={line}>→ {line}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm font-semibold opacity-70">Demo build with made-up shops, people and prices.</p>
      </aside>

      <main className="flex flex-col px-4 py-8 sm:px-10">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="mb-6 inline-flex self-start rounded-2xl border-2 border-ink bg-paper p-1" role="group" aria-label="Account type">
            {(["customer", "store"] as const).map((option) => (
              <Link
                key={option}
                href={`${pathname}?role=${option}`}
                replace
                aria-current={role === option ? "true" : undefined}
                className={cx(
                  "inline-flex h-9 items-center rounded-xl px-4 text-sm font-bold",
                  role === option ? "bg-ink text-white" : "hover:bg-ink/5",
                )}
              >
                {option === "customer" ? "Customer" : "Store"}
              </Link>
            ))}
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">{title}</h1>
          <div className="mt-6">{children}</div>
          <p className="mt-8 flex items-start gap-2 rounded-xl border-2 border-ink/15 bg-paper/70 px-3 py-2.5 text-sm text-ink-soft">
            <Info className="mt-0.5 size-4 shrink-0" />
            Demo sign-in. Passwords are not checked or saved, and accounts live only in this browser. Real sign-in
            comes later.
          </p>
          <p className="mt-4">
            <LegalLinks />
          </p>
        </div>
      </main>
    </div>
  );
}
