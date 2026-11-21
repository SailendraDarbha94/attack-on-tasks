"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthShell, useAuthRole, useRedirectIfSignedIn } from "@/components/auth-shell";
import { Button, Field, FormError } from "@/components/ui";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export default function SignupPage() {
  const role = useAuthRole();
  useRedirectIfSignedIn();
  return (
    <AuthShell role={role} title={role === "store" ? "Put your store online" : "Create your account"}>
      <SignupForm key={role} role={role} />
    </AuthShell>
  );
}

function SignupForm({ role }: { role: Role }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  // On success the session changes and useRedirectIfSignedIn moves us on.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    if (text("password").length < 6) {
      setError("Use a password of at least 6 characters.");
      return;
    }
    setPending(true);
    setError("");
    const result = await auth.signUp({
      role,
      name: text("name"),
      email: text("email"),
      phone: text("phone"),
      password: text("password"),
      storeName: text("storeName"),
      storeArea: text("storeArea"),
    });
    if (!result.ok) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Your name" name="name" autoComplete="name" placeholder="Asha Verma" required />
      {role === "store" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" name="storeName" placeholder="Verma General Stores" required />
          <Field label="Area" name="storeArea" placeholder="Jayanagar" required />
        </div>
      ) : null}
      <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      <Field label="Phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 90000 00000" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 6 characters. The demo does not save it."
        required
      />
      <FormError>{error}</FormError>
      <Button type="submit" variant="accent" size="lg" disabled={pending}>
        {pending ? "Creating account…" : role === "store" ? "Create store account" : "Create account"}
      </Button>
      <p className="text-sm text-ink-soft">
        By creating an account you agree to the{" "}
        <Link href="/terms" className="font-bold text-ink underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-bold text-ink underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="text-sm text-ink-soft">
        Already have one?{" "}
        <Link href={`/login?role=${role}`} className="font-bold text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
