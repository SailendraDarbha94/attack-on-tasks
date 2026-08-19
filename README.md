# Orrery

A personal, single-player habit game. You keep a star system. Every practice you
actually keep is a world in orbit, and how often it comes back around decides
which world carries it — water three times a day is Mercury, the gym every other
day is Mars, the review you owe yourself once a month is Neptune. Doing the work
is an observation that puts a world back on its ephemeris.

Two sungrazing comets cross the system on steep orbits: **Ashfall** and
**Stillwater**. They have no period and no due date, which is the truth about a
vice. Answering the check-in honestly is a measurement — a clean answer boils
mass off the nucleus, and the ablation rate is your star's luminosity. So every
world you return on time literally becomes the thing that burns the comets down.

The full design and roadmap live in [PLAN.md](./PLAN.md).

## The loop

- **Worlds** — commission a practice, pick its period, and a planet takes it up.
  Due worlds appear on the plane; observing one returns it to its ephemeris and
  gathers light. An honest "not this pass" costs exactly one pass.
- **Drift** — neglect never makes anything grow. A world off its ephemeris dims
  toward a floor and its orbit goes dashed: the system has simply lost track of
  it. The fix is one observation. Guilt becomes missing information.
- **Comets** — local notifications open observation windows (default every 3h,
  09:00–23:00). A clean answer ablates; a relapse is an outburst, recorded at
  2× — comets observably do this, so it reads as physics rather than punishment.
- **Perihelion** — starve a comet below mass 10 and the nucleus is bare. Let it
  make perihelion and it comes apart. Seventy-two hours later another fragment
  of the same parent is inbound, because that is how sungrazers work and how
  urges work.
- **Missions** — at 100 returns and one dispersal, Opportunity, Hubble and
  Voyager 1 take your system into their downlink and offer practices of their
  own.

## The body table

| World | Period | Real orbit | Why |
|---|---|---|---|
| Mercury | three times a day | 88 days | Fastest orbit in the sky; locked in a 3:2 spin–orbit resonance, so three is literally its number |
| Venus | twice a day | 225 days | Sees almost exactly two sunrises per orbit (and they rise in the west) |
| Earth | every day | 1 year | The unit itself — the only exact hit in the table |
| Mars | every 2 days | 1.88 years | Nearly exactly two Earth years; a sol is within 40 minutes of a day |
| Jupiter | every 3 days | 11.9 years | One zodiac sign per year — the old Year Star |
| Saturn | every week | 29.5 years | The one orbital period a human actually feels |
| Uranus | every 2 weeks | 84 years | Tipped 98°, so its rings read vertical — the only reliable glyph tell |
| Neptune | monthly | 165 years | Found by arithmetic before anyone looked. The deliberate end-stop |

Inward of Mars the mapping is near-numeric; outward it is honestly ordinal —
further out simply means less often.

## Stack

Expo SDK 57 (React Native + TypeScript + expo-router) · expo-sqlite with an
event-sourced, local-only engine (append-only log; all state derived by pure
functions) · Reanimated 4 · @shopify/react-native-skia · expo-notifications ·
expo-audio (procedurally synthesized SFX) · vitest.

`src/engine/` has zero React imports and carries the tests that matter: the
comet arithmetic, scheduling and expiry, world periods and drift, the body
table, the missions gate, and comet returns.

## Develop

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest — engine unit tests
npx expo start      # dev server (use a dev build, not Expo Go)
```

After adding a route, regenerate typed routes without starting the dev server:
`npx expo customize tsconfig.json`.

## Install on the phone

```bash
npx expo run:ios --device --configuration Release
```

Requires Xcode and the Apple Developer profile. Keep the phone plugged in and
unlocked through the install step.

## Two things that must not change

`ios.bundleIdentifier` in app.json and `DB_NAME` in `src/db/index.ts` are load
-bearing. The iOS data container is keyed to the bundle id and the event log
lives in that database file. Changing either silently installs a second, empty
app beside a real history that nothing will ever read again. Both keep their
original names on purpose.

## Art

No photographs, no character art, no licensed material — every body is drawn in
Skia at runtime, and the icon and scenery are generated from vector sources by
the scripts in [tools/art](./tools/art). Run them, diff the output, commit.
