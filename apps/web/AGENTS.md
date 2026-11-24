# This is not the Next.js you know

This app is on Next.js 16 with Cache Components on. APIs, conventions and file
structure differ from older versions and from most examples online. Read the
relevant guide in `node_modules/next/dist/docs/` before writing code, and heed
deprecation notices.

Things that have already mattered here:

- With `cacheComponents: true`, a server component that awaits data must
  either cache it (`'use cache'` plus `cacheLife`) or sit inside `<Suspense>`.
- A function exported from a `'use client'` file cannot be called from a
  server component. Keep shared helpers in files without the directive.
- Tailwind 4 runs through the `@tailwindcss/turbopack` loader set up in
  `next.config.ts`. Design tokens live in `app/globals.css` under `@theme`.
