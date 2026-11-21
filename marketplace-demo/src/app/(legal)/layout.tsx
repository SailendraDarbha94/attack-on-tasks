import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BRAND, Logo } from "@/components/brand";
import { buttonClass } from "@/components/classes";
import { LegalLinks } from "@/components/legal";

// Plain static pages: no demo data, so they render fully on the server.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b-2 border-ink bg-cream">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/" className={buttonClass("outline", "sm")}>
            <ArrowLeft className="size-4" strokeWidth={2.5} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</div>
      </main>

      <footer className="border-t-2 border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-soft sm:px-6">
          <p>{BRAND} is a demo. Shops, people and prices are made up.</p>
          <LegalLinks />
        </div>
      </footer>
    </>
  );
}
