"use client";

// DEMO AUTH. This is the one seam to replace when real authentication arrives:
// keep the AuthService shape, swap `mockAuth` for a client that talks to your
// auth provider, and the sign-in and sign-up pages keep working unchanged.
//
// The mock never checks or stores passwords. It only looks the email up in the
// demo data held in this browser.
import { useDb, type NewAccountInput } from "./db";
import { useSession } from "./session";
import type { Account, Role } from "./types";

export type AuthResult = { ok: true; account: Account } | { ok: false; error: string };

export interface SignUpInput extends NewAccountInput {
  password: string;
}

export interface AuthService {
  signIn(email: string, password: string, role: Role): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  signOut(): Promise<void>;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockAuth: AuthService = {
  async signIn(email, password, role) {
    await pause(350);
    const wanted = email.trim().toLowerCase();
    if (!wanted || !password) return { ok: false, error: "Enter your email and password." };
    const account = useDb.getState().accounts.find((a) => a.email === wanted);
    if (!account) {
      return { ok: false, error: "No account with that email in this demo. Pick a demo account or create one." };
    }
    if (account.role !== role) {
      const other = account.role === "store" ? "store" : "customer";
      return { ok: false, error: `That email belongs to a ${other} account. Switch the toggle above to sign in.` };
    }
    useSession.getState().setAccount(account.id);
    return { ok: true, account };
  },

  async signUp(input) {
    await pause(350);
    const email = input.email.trim().toLowerCase();
    if (useDb.getState().accounts.some((a) => a.email === email)) {
      return { ok: false, error: "An account with that email already exists. Sign in instead." };
    }
    const account = useDb.getState().createAccount(input);
    useSession.getState().setAccount(account.id);
    return { ok: true, account };
  },

  async signOut() {
    useSession.getState().setAccount(null);
  },
};

export const auth: AuthService = mockAuth;

export function homeFor(role: Role): string {
  return role === "store" ? "/store" : "/shop";
}
