import Link from "next/link";

// Placeholder product name. Change it here and it changes everywhere.
export const BRAND = "Nukkad";
export const BRAND_MEANING = "“Nukkad” is Hindi for the street corner, where the neighbourhood shop is.";

export function Logo({ href = "/", onDark = false }: { href?: string; onDark?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label={`${BRAND} home`}>
      <span
        aria-hidden
        className="grid size-9 -rotate-6 place-items-center rounded-xl border-2 border-ink bg-lime font-display text-xl font-extrabold leading-none text-ink shadow-hard-sm"
      >
        n
      </span>
      <span className={`font-display text-2xl font-extrabold lowercase leading-none tracking-tight ${onDark ? "text-white" : "text-ink"}`}>
        {BRAND}
      </span>
    </Link>
  );
}

/** Shown while the browser-only part of the app starts up. */
export function Splash() {
  return (
    <div className="grid min-h-screen flex-1 place-items-center bg-cream">
      <div className="flex animate-pulse flex-col items-center gap-3">
        <span
          aria-hidden
          className="grid size-16 -rotate-6 place-items-center rounded-2xl border-2 border-ink bg-lime font-display text-4xl font-extrabold leading-none shadow-hard"
        >
          n
        </span>
        <p className="text-sm font-semibold text-ink-soft">Opening the shutters…</p>
      </div>
    </div>
  );
}
