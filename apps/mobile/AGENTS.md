This is an Expo/React Native app. One binary serves customers and stores; the
root layout sends each account to its own route group by role.

## Expo has changed: do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that
touches an Expo, EAS or React Native API:

1. Read the major version of `expo` in `package.json`.
2. Read the matching docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, start from https://docs.expo.dev/llms.txt

## Commands

```bash
npx expo install <package>  # ALWAYS, instead of pnpm add: picks SDK-compatible versions
npx expo start              # dev server; press w for the browser preview
npx expo lint
npx tsc --noEmit
```

Run lint and typecheck before calling a task done.

## How this app is put together

- Routes live in `src/app/`: `index` (role picker), `sign-in`, `customer/*`,
  `store/*`. Keep everything that is not a screen outside `src/app/`.
- `src/features/<area>/` holds each area's API hooks, stores and components.
  Keep `customer` and `store` code free of imports from each other, so the
  two can become separate apps later without a rewrite.
- Server data goes through TanStack Query (`features/*/api.ts`); the cart, the
  delivery location and the session token are small persisted Zustand stores.
- `src/lib/api.ts` is the only place that calls `fetch`.
- The app is light-only. Colours, type and spacing come from
  `src/constants/theme.ts`; do not hard-code them in screens.
- `Alert.alert` does nothing on the web. Confirm destructive actions inline
  ("Tap again to…") so the browser preview behaves like the phone.
- `ios/` and `android/` are generated and git-ignored. Never edit them by hand.
