# Nukkad

Groceries from the corner store, delivered in minutes (think Swiggy Instamart).
A customer opens the app, the nearest of the stores is chosen from where they
are, they fill a cart, give an address and order. The store sees the order in
the same app and works it through to delivered. One app serves both, by role.
There is no rider role yet: the store hands orders over and marks them delivered.

## Layout

```
apps/api       NestJS 11 + Fastify, port 4000. Owns the Prisma schema.
apps/mobile    Expo SDK 58, Expo Router. Customer and store, one app.
apps/web       Next 16. Marketing site today; admin later.
packages/core  Shared types and pure logic: roles, the order state machine,
               money, distance, picking the nearest store. Built to dist/.
packages/config  tsconfig bases.
marketplace-demo  An early throwaway demo. REFERENCE ONLY, see below.
```

`marketplace-demo/` is not part of the workspace. It is kept to look at, never
to build on: do not import from it, copy code out of it, or change it.

## Commands

```bash
pnpm install
pnpm dev            # core (watch) + api (:4000) + web (:3000)
pnpm dev:mobile     # Expo dev server; press w for the browser preview
pnpm typecheck
pnpm lint
pnpm test           # unit tests (packages/core)
pnpm db:migrate     # apply migrations
pnpm db:seed        # RESET the local database to the demo data
pnpm --filter @nukkad/api test:e2e   # needs the API running on a fresh seed
```

Prefer `.claude/launch.json` (`api`, `web`, `mobile-web`) over raw shell for
servers; it captures logs.

## Things that will bite you

- **`@nukkad/core` is consumed as built `dist/`, not source.** After editing it,
  rebuild (`pnpm --filter @nukkad/core build`) or run `pnpm dev`, which watches
  it. Otherwise the apps keep seeing the old code.
- **Fastify rejects a request with `Content-Type: application/json` and no
  body.** Clients send the header only with a body (see `apps/mobile/src/lib/api.ts`).
- **Nest's watcher does not reload `.env`.** Restart the API after changing it.
- **Sign-in is a stand-in.** `apps/api/src/auth/dev-auth.controller.ts` signs
  anyone in without a password when `DEV_AUTH=1`, and the API refuses to start
  with that set in production. `AuthGuard` already verifies Supabase Auth
  tokens (JWKS) when `SUPABASE_URL` is set; real sign-in replaces the dev
  controller and the mobile sign-in screen, nothing else.
- **The server is the authority.** Clients send product ids and quantities,
  never prices. Stock is taken with a conditional update inside the order's
  transaction. The transition table in `packages/core/src/order.ts` is
  enforced by `OrdersService.transition`; the apps only use it to pick buttons.
- **Money is integer paise.** Never floats, never rupees in the database.
- **A store account works on its own store only.** The store id comes from
  the signed-in account, never from the request.
- **Local Postgres needs a locale to start:**
  `LC_ALL=en_US.UTF-8 pg_ctl -D /opt/homebrew/var/postgresql@17 start`.
- **Never run `expo run:ios` / `expo prebuild` outside `apps/mobile`.**

## Framework versions

Expo and Next.js both ship breaking changes each release. Do not write their
APIs from memory:

- Mobile: read the versioned docs for the `expo` major in
  `apps/mobile/package.json` (`https://docs.expo.dev/versions/v58.0.0/`), and
  add dependencies with `npx expo install` from `apps/mobile`.
- Web: read `node_modules/next/dist/docs/` first. See `apps/web/AGENTS.md`.

## Working agreements

- **Never commit or push without being asked.** Each request to commit covers
  that commit only.
- **Verify before claiming.** Run the typecheck, boot the server, drive the
  screen. Say what was not checked.
- **Migrations are applied deliberately.** Say what is pending; do not apply
  to a shared database silently.
- Comments explain why, not what. Match the density of the file you are in.
