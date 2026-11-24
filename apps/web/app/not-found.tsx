import Link from "next/link";

import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-5 px-5 py-20">
      <Logo />
      <h1 className="font-display text-4xl font-extrabold">This page isn’t on the shelf</h1>
      <p className="text-lg text-ink-soft">The link may be old, or the page may have moved.</p>
      <Link href="/" className="rounded-2xl bg-tomato px-6 py-3 font-semibold text-white hover:bg-tomato-dark">
        Back to the home page
      </Link>
    </main>
  );
}
