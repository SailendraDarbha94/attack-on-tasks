# Nukkad marketplace demo

A demo website for a two-sided grocery marketplace. Visitors choose whether they
are a **customer** or a **store**:

- **Customers** browse neighbourhood stores, fill a cart, pick a saved address
  (or add one if they have none), place an order and track it.
- **Stores** get a dashboard: today's numbers and a 7-day sales chart, current
  and past orders, inventory they can add to and edit, and their vendors,
  potential vendors and purchase orders.

"Nukkad" is a placeholder name (Hindi for the street corner). Change `BRAND` in
`src/components/brand.tsx` to rename the product everywhere.

This folder is separate from the Orrery app in the repo root. It has its own
`package.json` and is excluded from the root `tsconfig.json`.

## Run it

```bash
cd marketplace-demo
npm install
npm run dev -- --port 3210
```

Then open http://localhost:3210.

## Demo accounts

The sign-in page lists these, one click each. Passwords are not checked.

| Role | Name | Notes |
| --- | --- | --- |
| Customer | Ananya Rao | Two saved addresses, a live order and order history |
| Customer | Kabir Mehta | No saved addresses, so checkout asks for one |
| Store | Lakshmi Narayan | Sri Lakshmi Kirana: the fullest data, with vendors and purchase orders |
| Store | Farhan Sheikh | Green Basket Organics |
| Store | Meera Iyer | Daily Needs Mart |

Signing up creates a new account. A new store starts empty, which shows the
empty states and the "add your first product" path.

**See both sides at once:** open two tabs, sign in as a customer in one and a
store in the other. Each tab has its own sign-in, and they share data, so an
order placed in one appears in the other without a reload.

"Reset demo data" (in the page footer or the dashboard sidebar) restores the
original data.

## What is real and what is not

Everything is made up: shops, people, phone numbers, addresses and prices.
There is no server and no database.

- **Data** lives in the browser's `localStorage` (`src/lib/db.ts`), seeded from
  `src/lib/seed.ts`.
- **The signed-in account and the cart** live in `sessionStorage`
  (`src/lib/session.ts`), which is why each tab is its own session.
- **Payment** is a choice of label only. Nothing is charged.
- **The Privacy Policy and Terms of Service** at `/privacy` and `/terms` are
  placeholder text, labelled as such on the page and hidden from search
  engines. Replace them with reviewed text before launch.

## Wiring up real sign-in later

`src/lib/auth.ts` is the one seam. It exports an `auth` object with `signIn`,
`signUp` and `signOut`, all async. Replace the `mockAuth` implementation with
calls to your auth provider and the sign-in and sign-up pages keep working.

Once data comes from a real backend:

- Replace the actions in `src/lib/db.ts` with API calls.
- Remove `BrowserApp` from `src/app/(app)/layout.tsx`. It makes that whole
  section render in the browser only, because the data is in browser storage.
- Remove the `instantInsights` setting from `next.config.ts`. It quiets a
  dev-time check that cannot pass while pages are browser-only.
- Route protection is currently a client-side redirect (`useRequireRole` in
  `src/lib/hooks.ts`). Move it to the server when there is a real session.

## Layout

```
src/app/page.tsx                 landing page with the customer/store choice
src/app/(legal)/privacy, terms   placeholder legal pages (replace before launch)
src/app/(app)/login, signup      demo auth pages
src/app/(app)/(customer)/...     shop, shop/[storeId], checkout, orders, account
src/app/(app)/store/...          overview, orders, inventory, vendors
src/components/                  UI kit, cart, charts, order cards
src/lib/                         types, seed data, stores, mock auth, formatting
```

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4 and Zustand. Read
`AGENTS.md` before changing framework-level code: this Next.js version differs
from older ones.
