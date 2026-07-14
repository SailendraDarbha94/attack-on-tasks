# Attack on Tasks

A personal, single-player habit game. The Smoking Titan and the Drinking
Titan roam the Forest of the Giant Trees; whether they grow or shrink
depends on what you did with your hands in the last few hours. Chores are
lesser Titans. You win by living well, two hours at a time.

The full vision, architecture, and chapter-by-chapter roadmap live in
[PLAN.md](./PLAN.md).

## Stack

Expo (React Native, TypeScript, expo-router) · SQLite (event-sourced,
local-only) · Reanimated + stock Lottie effects · vitest for the pure-TS
game engine.

## Develop

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest — engine unit tests
npx expo start      # dev server (use a dev build, not Expo Go)
```

## Install on the phone

```bash
npx expo run:ios --device --configuration Release
```

Requires Xcode and the Apple Developer profile. Personal project — not for
distribution (Attack on Titan IP).
