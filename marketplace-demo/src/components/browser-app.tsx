"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import { browser } from "react-dom";
import { RotateCcw } from "lucide-react";
import { DB_KEY, useDb } from "@/lib/db";
import { useCart } from "@/lib/session";

/**
 * Everything inside renders only in the browser, because the demo's data and
 * session live in browser storage. The server sends the <Suspense> fallback.
 */
export function BrowserApp({ children }: { children: ReactNode }) {
  use(browser("Demo data and the signed-in session live in this browser's storage."));

  useEffect(() => {
    // First visit: write the seed out, so every tab reads the same copy.
    if (!localStorage.getItem(DB_KEY)) useDb.setState({});
    // Another tab changed the data (say, a customer placed an order): pick it up.
    const onStorage = (event: StorageEvent) => {
      if (event.key === DB_KEY) void useDb.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return children;
}

export function ResetDemoButton({ onDark = false }: { onDark?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const tone = onDark ? "text-white/70 hover:text-white" : "text-ink-soft hover:text-ink";

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={`inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline ${tone}`}>
        <RotateCcw className="size-3.5" />
        Reset demo data
      </button>
    );
  }
  return (
    <span className={`inline-flex items-center gap-3 text-sm font-semibold ${onDark ? "text-white" : "text-ink"}`}>
      Wipe all orders and changes?
      <button
        type="button"
        className="underline underline-offset-4"
        onClick={() => {
          useDb.getState().resetDemo();
          useCart.getState().clear();
          setConfirming(false);
        }}
      >
        Yes, reset
      </button>
      <button type="button" className="underline underline-offset-4" onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  );
}
