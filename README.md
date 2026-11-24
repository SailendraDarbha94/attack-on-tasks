# Nukkad

Groceries and daily essentials from the store round the corner, delivered in
minutes. A customer's nearest store is chosen automatically from their
location; they fill a cart, add an address and order. The store receives the
order in the same app and takes it from accepted to delivered.

## What is in here

| Path | What |
|---|---|
| `apps/api` | NestJS 11 + Fastify REST API, Prisma, Postgres |
| `apps/mobile` | Expo SDK 58 app for customers and stores (role-gated) |
| `apps/web` | Next.js 16 marketing site |
| `packages/core` | Shared types and rules: order states, money, nearest-store logic |
| `packages/config` | Shared tsconfig |
| `marketplace-demo` | An early demo site, kept for reference only. Not part of the workspace. |

## First-time setup

Requires Node 22, pnpm 10 and a local Postgres (Homebrew `postgresql@17` works).

```bash
pnpm install
```

```bash
LC_ALL=en_US.UTF-8 pg_ctl -D /opt/homebrew/var/postgresql@17 start
```

```bash
createdb nukkad_dev
```

Copy `apps/api/.env.example` to `apps/api/.env`, put your Mac username in the
two database URLs and any long random string in `AUTH_JWT_SECRET`. Then:

```bash
pnpm --filter @nukkad/core build
```

```bash
pnpm db:migrate
```

```bash
pnpm db:seed
```

## Running it

```bash
pnpm dev
```

starts the API on http://localhost:4000 and the website on http://localhost:3000.

```bash
pnpm dev:mobile
```

starts Expo. Press `w` for the browser preview, which is the quickest way to
try the app. A phone on the same Wi-Fi finds the API by itself.

To see both sides at once in a browser, open the app at `localhost` in one tab
and at `127.0.0.1` in another: each address keeps its own sign-in.

## Demo data

`pnpm db:seed` resets the local database to:

- **Two stores**, Nukkad Jayanagar and Nukkad Indiranagar, each delivering
  within 4.5 km. Delivery is ₹25, free above ₹299; the minimum order is ₹99.
- **71 products** in 9 categories. Indiranagar stocks 8 fewer, so its
  "add from the catalogue" screen has something in it.
- **Four accounts**, on the sign-in screen:

| Account | Role | Notes |
|---|---|---|
| Aditi Rao | customer | Two saved addresses, one near each store; three sample orders |
| Rohan Shetty | customer | No saved address, so checkout asks for one |
| Nukkad Jayanagar | store | Has a new order waiting |
| Nukkad Indiranagar | store | Has an order being packed |

Everything is made up: people, phone numbers, addresses and prices.

## What is real and what is a stand-in

- **Real:** the catalogue, per-store prices and stock, nearest-store
  selection, delivery-area and minimum-order checks, order placement (priced
  and stock-checked on the server, safe to retry), the order state machine,
  the store's order queue and shelf management.
- **Stand-in: sign-in.** There are no passwords. The API signs in any demo
  account when `DEV_AUTH=1` and will not start that way in production. The
  guard behind every route already accepts Supabase Auth tokens, so wiring
  real sign-in means replacing one controller and one screen.
- **Stand-in: payment.** Cash or UPI on delivery, as a label on the order.
- **Not built yet:** riders, push notifications, live order updates (the app
  polls every 5 seconds), a map for the address pin, product photos (emoji for
  now), an admin site, and store sign-up.

## Tests

```bash
pnpm test
```

runs the unit tests for the shared rules. With the API running on a fresh seed,

```bash
pnpm --filter @nukkad/api test:e2e
```

runs 23 end-to-end checks: ordering, stock, delivery area, the store workflow
and shelf management. They change data, so seed again afterwards.
