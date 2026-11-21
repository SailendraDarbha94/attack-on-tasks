"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { homeFor } from "./auth";
import { useDb } from "./db";
import { useCart, useSession } from "./session";
import type { Account, Address, Role, Store } from "./types";

/** The current time, refreshed on an interval so "5 min ago" labels stay honest. */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

export function useAccount(): Account | null {
  const accountId = useSession((s) => s.accountId);
  return useDb((s) => s.accounts.find((a) => a.id === accountId) ?? null);
}

/**
 * Returns the signed-in account when it has the right role. Otherwise sends the
 * visitor to sign in (or to their own side of the product) and returns null.
 */
export function useRequireRole(role: Role): Account | null {
  const account = useAccount();
  const router = useRouter();
  const allowed = account?.role === role;
  const fallback = account ? homeFor(account.role) : `/login?role=${role}`;
  useEffect(() => {
    if (!allowed) router.replace(fallback);
  }, [allowed, fallback, router]);
  return allowed ? account : null;
}

export function useMyStore(account: Account | null): Store | null {
  return useDb((s) => s.stores.find((x) => x.id === account?.storeId) ?? null);
}

/** The address the customer is delivering to: their pick, or their first saved one. */
export function useDeliveryAddress(account: Account): Address | null {
  const addressId = useCart((s) => s.addressId);
  return account.addresses.find((a) => a.id === addressId) ?? account.addresses[0] ?? null;
}
