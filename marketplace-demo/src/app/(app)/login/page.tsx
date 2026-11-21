"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { AuthShell, useAuthRole, useRedirectIfSignedIn } from "@/components/auth-shell";
import { Button, Field, FormError } from "@/components/ui";
import { auth } from "@/lib/auth";
import { useDb } from "@/lib/db";
import type { Account, Role, Store } from "@/lib/types";

export default function LoginPage() {
  const role = useAuthRole();
  useRedirectIfSignedIn();
  return (
    <AuthShell role={role} title={role === "store" ? "Sign in to your store" : "Sign in to shop"}>
      <LoginForm key={role} role={role} />
    </AuthShell>
  );
}

function describe(account: Account, stores: Store[]): string {
  if (account.role === "store") {
    const store = stores.find((s) => s.id === account.storeId);
    return store ? `${store.name}, ${store.area}` : "Store owner";
  }
  const count = account.addresses.length;
  if (count === 0) return "No saved addresses yet, so checkout asks for one";
  return `${count} saved ${count === 1 ? "address" : "addresses"}`;
}

function LoginForm({ role }: { role: Role }) {
  const accounts = useDb((s) => s.accounts);
  const stores = useDb((s) => s.stores);
  const demoAccounts = useMemo(() => accounts.filter((a) => a.demo && a.role === role), [accounts, role]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  // On success the session changes and useRedirectIfSignedIn moves us on.
  async function signIn(emailValue: string, passwordValue: string) {
    setPending(true);
    setError("");
    const result = await auth.signIn(emailValue, passwordValue, role);
    if (!result.ok) {
      setError(result.error);
      setPending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void signIn(email, password);
  }

  return (
    <div className="grid gap-8">
      <section aria-labelledby="demo-accounts">
        <h2 id="demo-accounts" className="text-sm font-bold uppercase tracking-wide text-ink-soft">
          Jump in with a demo account
        </h2>
        <ul className="mt-3 grid gap-3">
          {demoAccounts.map((account) => (
            <li key={account.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => void signIn(account.email, "demo-password")}
                className="group flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-paper p-3 text-left shadow-hard-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <span
                  aria-hidden
                  className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-mango font-display text-xl font-extrabold"
                >
                  {account.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{account.name}</span>
                  <span className="block truncate text-sm text-ink-soft">{describe(account, stores)}</span>
                </span>
                <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
        <span className="h-0.5 flex-1 bg-ink/10" />
        or use your email
        <span className="h-0.5 flex-1 bg-ink/10" />
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder={role === "store" ? "lakshmi@nukkad.demo" : "ananya@nukkad.demo"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Anything works in the demo"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <FormError>{error}</FormError>
        <Button type="submit" variant="accent" size="lg" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-sm text-ink-soft">
          New here?{" "}
          <Link href={`/signup?role=${role}`} className="font-bold text-ink underline underline-offset-4">
            Create a {role === "store" ? "store" : "customer"} account
          </Link>
        </p>
      </form>
    </div>
  );
}
