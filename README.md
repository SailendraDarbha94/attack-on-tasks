# Attack on Tasks

A personal, single-player habit game. The Smoking Titan and the Drinking
Titan roam the Forest of the Giant Trees; whether they grow or shrink
depends on what you did with your hands in the last few hours. Chores are
lesser Titans. You win by living well, a few hours at a time.

The full vision, architecture, and chapter-by-chapter roadmap live in
[PLAN.md](./PLAN.md).

## The game so far

- **Encounters** — local notifications summon you (default every 3h,
  09:00–23:00). Answer honestly; honesty itself is XP. A clean answer
  strikes the boss smaller, a relapse feeds it. Missed encounters linger,
  then expire neutrally — a busy day is not a failed day.
- **Lesser Titans** — summon your own chores via ＋ (name + cadence).
  Due chores stalk the clearing; doing the work fells them and sharpens
  your blades against the bosses. An honest "not today" defers without
  penalty.
- **The finishing blow** — starve a boss below strength 10 and its card
  offers the finisher. The forest goes quiet… for 72 hours. Then the urge
  returns, full-size. That's the honest part.
- **The Three Captains** — fell 100 lesser Titans and slay one boss, and
  Levi, Hange, and Erwin arrive with quest Titans of their own (strength &
  cleanliness, knowledge & curiosity, willpower & leadership).
- **The forest lives** — walking titans with turn-around patrols, drifting
  mist, fireflies and Skia-glow embers, parallax camera sway, light shafts,
  falling leaves, a day/night tint on your real clock, and screen shake +
  procedural blade audio on every kill.

## Stack

Expo SDK 57 (React Native + TypeScript + expo-router) · expo-sqlite with an
event-sourced, local-only engine (append-only event log; all state derived
by pure functions) · Reanimated 4 · @shopify/react-native-skia ·
expo-notifications · expo-audio (procedurally synthesized SFX) · vitest for
the engine.

The engine (`src/engine/`) has zero React imports and carries the unit
tests that matter: titan math, scheduling/expiry, chores, captains gate,
respawn.

## Develop

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest — engine unit tests
npx expo start      # dev server (use a dev build, not Expo Go)
```

After adding a route, regenerate typed routes without starting the dev
server: `npx expo customize tsconfig.json`.

## Install on the phone

```bash
npx expo run:ios --device --configuration Release
```

Requires Xcode and the Apple Developer profile. Keep the phone plugged in
and unlocked through the install step.

## Art

Titan sprites follow one contract (`src/components/TitanFigure.tsx`): 2:3
transparent PNGs, one per titan kind per pose (idle / grown / flinch /
dying / walk) in `assets/titans/`. Swap the files, touch no screen code.
Scenery in `assets/scenery/` is generated vector art; character art is
processed from personal reference images.

Personal project — never for distribution (Attack on Titan IP stays legal
only on this one phone).
