"use client";

import { createContext, useContext } from "react";
import type { Account, Store } from "@/lib/types";

export interface StoreSession {
  account: Account;
  store: Store;
}

export const StoreContext = createContext<StoreSession | null>(null);

/** The signed-in owner and their store. Only valid under the store layout. */
export function useStoreSession(): StoreSession {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStoreSession must be used inside the store dashboard layout");
  return value;
}
