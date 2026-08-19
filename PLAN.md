# Orrery — Build Plan

> I keep a star. Every practice I actually keep is a world it holds in orbit,
> and the faster the orbit, the more often the work. Two comets cross the
> system on steep paths, and they only get smaller when I tell the truth
> about them.

A personal, single-player habit game for iPhone. Recurring practices are
worlds, mapped to planets by how often they come due. Two vices are sungrazing
comets. The player wins by living well, a few hours at a time.

---

## Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Stack | Expo React Native + TypeScript | Already known; local notifications; one codebase |
| Visuals | Static illustrations + motion effects (Reanimated) | 90% of the emotional payoff, 10% of the effort, upgradeable later |
| Data | Local-only, on-device SQLite | No accounts, no server, private by construction |
| Audience | Just me, personal iPhone | No licensed material anywhere; the theme is astronomy, which belongs to nobody |
| Schedule | Bursty | Every chapter is sliced into sessions that end shippable |

**Art note:** every body is a NASA photograph — public domain by construction:
SDO's sun (fetched the day of the build), Apollo 17's Earth, MESSENGER's
Mercury, Magellan's Venus, LRO's Moon, Viking's Mars, Voyager's Jupiter/Uranus/
Neptune, Cassini's Saturn, OSIRIS-REx's Bennu — masked into sprites by
`tools/art/nasa-bodies.mjs`. Comets, orbits, trails and every effect stay Skia.
No licensed material anywhere, so this one *could* still leave the phone if it
ever earned the right to.

---

## Design pillars

1. **The comet must be out there between check-ins.** Its mass is persistent
   state you carry around. Opening the app and seeing Ashfall *smaller than
   last week* is the product.
2. **Relapse keeps you in the game.** If answering "yes, I smoked" feels
   like humiliation, you will stop opening the app — the same abandonment
   loop as every task app before it. A "yes" is an outburst: recorded, worth
   the same light as any other honest entry, and always followed by the next
   window time rather than a verdict. Never zero out all progress on one bad
   answer.
3. **Perihelion is earned, not given.** A comet does not come apart from one
   good afternoon. Sustained honesty ablates it toward a threshold; crossing
   it bares the nucleus and unlocks the finisher. The game mechanic and the
   actual life goal are the same curve.
4. **Every build session ends with a working app on the phone.** Bursty
   schedule rule: no half-finished refactors at the end of a session. If a
   feature can't land whole, it lands behind a flag or waits.
5. **Dogfood from the first session.** You are the only user. The app must be on
   your phone and answering real check-ins before any further chapter gets
   built — using it *is* the requirements-gathering.

---

## Core loop

### Observation windows
- Local scheduled notifications during observing hours (default: every 3h,
  09:00–23:00; configurable). Each one opens a window on both comets.
- Tapping opens the **Observation screen**: the comet drawn at its current
  mass, its line, one blunt question — *"Have you smoked in the last few
  hours?"* — with IT FADED / IT FLARED.
- **FADED** → ablation: flash, shake, flare burst, haptic; mass drops, light
  gathered.
- **FLARED** → an outburst, recorded at 2×, the comet's line, then the next
  window time. Never a verdict, never a streak apocalypse.
- **Missed windows pass neutrally.** Unanswered windows older than ~12h
  resolve as cloud cover — neither ablation nor outburst — so a busy day is
  not a punished day.

### Comet state
- Each vice comet has `mass` (0–200, arrives at 100).
- FADED: −Δ where Δ is your star's ablation. FLARED: +2Δ. The asymmetry is
  physics: comets observably outburst, 17P/Holmes by a factor of half a
  million in 2007.
- Mass at or below 10 spends the volatiles and bares the nucleus, unlocking
  the finisher: let it make perihelion and it comes apart. Seventy-two hours
  later another fragment of the same parent is inbound.

### Worlds, light and luminosity
- A world is a recurring practice. Its period decides which planet carries
  it, and the planet is **derived, never stored** — so renegotiating a
  cadence moves the world and keeps its entire history.
- Light comes from every honest answer (either way) and from every world
  returned on time. Luminosity rises with light, and luminosity *is* the
  ablation rate. Folding the laundry is what burns down the smoking.
- Drift replaces guilt: a world off its ephemeris dims to a floor and its
  orbit goes dashed. Nothing ever grows. The remedy is one observation.

---

## Architecture

```
src/app/                expo-router routes
  index.tsx             home: the plane — star, due worlds, crossing comets
  observation.tsx       the check-in
  add-world.tsx         commission a practice, pick its period
  observatory.tsx       the log, four headline numbers, JSON export
  missions.tsx          Opportunity / Hubble / Voyager 1
  settings.tsx          cadence, observing hours, comets tracked
src/
  db/                   expo-sqlite + append-only migrations
  engine/               pure TS: comet math, bodies, worlds, scheduling
  state/                zustand store (UI state only)
  content/              comet lines, mission text, notification copy
  components/           Skia glyphs, sky ambience, effects
```

- **Event-sourced core.** One append-only `events` table is the source of
  truth: `(id, timestamp, type, payload)`. Comet mass, light, luminosity,
  world due-ness and drift are all *derived* by pure functions in
  `src/engine/`. Balance changes never corrupt history; you recompute.
- **`src/engine/` has zero React imports** and carries the only unit tests
  that matter: comet math, expiry, world periods and drift, the body table,
  the missions gate, comet returns.
- Tables besides `events`: `chores` (still named that on disk — the rows are
  worlds) and a small `settings` KV. Everything else is derived.

### Key packages
`expo-router`, `expo-sqlite`, `expo-notifications`, `expo-dev-client`,
`react-native-reanimated`, `@shopify/react-native-skia`, `expo-haptics`,
`expo-audio`, `zustand`.

### Visual approach (locked, amended)
The bodies are photographed; everything that moves is drawn.

1. **NASA sprites** — sun, eight planets, Moon, Earth and Bennu from mission
   archives, masked offline in `tools/art`; two Skia comets whose coma and
   tail scale with mass.
2. **Reanimated choreography** — orbital motion, corona breathing, drift
   dimming, screen shake on an observation.
3. **Generated vector assets** (`tools/art`) for the icon and the vignette —
   deterministic, diffable, re-runnable.
4. **Haptics + sound** under everything.

Rule: no rigged character animation, no 3D. Photography is NASA public
domain only, processed through `tools/art` so it stays deterministic and
re-runnable — never pasted in by hand.

### Three traps to respect
- **Notifications:** go straight to a development build (`expo-dev-client`).
  iOS caps pending scheduled local notifications at 64 — schedule a rolling
  ~2 days ahead and refresh on every app open, driven by the engine.
- **Missed-window logic lives in the engine, not the notification layer.** On
  every app open: compute expected windows since last open, diff against
  answered ones, materialize what expired and what came back. Notifications
  are doorbells; the engine is the clock.
- **The bundle id and the database filename are load-bearing.**
  `com.sailendradarbha.attackontasks` and `attack-on-tasks.db` keep their
  original names forever, however wrong they now look. The iOS data container
  is keyed to the bundle id; changing either installs a second empty app
  beside an irreplaceable log that nothing will ever read again.

---

## Build order

Sized in **sessions** (one session ≈ a 2–4h sitting).

### Session 1 — the re-theme lands *(done)*
IP purge, engine and content re-founded on bodies/comets/light, new generated
icon, all screens rewritten, 60 engine tests green. Ends installed.

### Session 1b — home, asteroids, population *(done)*
Earth as home anchor with the Moon on dailies, asteroid deadline tasks with
approach rendering and strike materialization, population with streak
multiplier, ledger card on Earth, deadline notifications. Broke a real
schedule↔system import cycle (time constants now live in a leaf module).

### Session 2 — close the data gaps
Ship the JSON export lifeboat *first*, then `MIGRATIONS[1]`: rename the two
legacy event strings (`titan_killed` → `comet_disintegrated`,
`titan_respawned` → `comet_returned`) in one transaction with a test proving
`computeGameState` is identical across the rename. Widen the period picker to
all eight bodies.

### Session 3 — the plane in Skia
Star with a corona radius driven by luminosity, orbit arcs, the eight glyphs,
dust field, sky tint on the real clock. Due-only rendering capped at 5.

### Session 4 — the comets
Coma and tail scaling with mass, Ashfall's curved warm dust tail vs
Stillwater's straight ion tail, the bare-nucleus state, the perihelion
finisher with a breakup, the inbound-fragment countdown.

### Session 5 — recovery and honesty
Re-tier the report line on logging streak rather than clean answers. Cadence
renegotiation as an in-place period change that keeps all history. The
missions screen at the unchanged 100 + 1 gate.

### Session 6 — ceremony and sound
Retune the three SFX into pulse/resolve/surge properly, add a
perihelion chime, tune the haptic choreography. Then **stop building and live
with it** — the dogfooding gate is still the point.

---

## iPhone distribution — resolved

Apple Developer Program membership already in hand, and a dev build has
already been loaded onto the phone in a previous project. No 7-day signing
expiry risk. Ship ad-hoc/dev-client builds signed with the paid profile
(year-long installs); move to TestFlight later only if over-the-air updates
become worth the upload ceremony.

---

## Risks, named

| Risk | Mitigation |
|---|---|
| Builder's motivation > user's motivation (your own diagnosis) | Dogfooding gate after the loop is whole; app on phone every session |
| Notification fatigue → resentment → uninstall | Configurable cadence, quiet hours, neutral expiry for missed encounters |
| Shame spiral on relapse → avoidance → abandonment | Pillar 2: an outburst is data, ends on the next window time; nothing resets |
| Dishonest answers hollow out the game | XP for honesty itself; no cloud, no witnesses — the game only ever plays against you |
| 7-day signing expiry kills the app mid-week | Resolved — paid developer account already in hand |
| Renaming the app orphans the on-device event log | Bundle id and DB filename are frozen; export lifeboat ships before any migration |
| Scope creep toward a game engine | No 3D and no rigged animation; Skia only, parked behind months of proven use |

---

## Not building (yet, or ever)

Accounts/auth, cloud sync, social features, Android, app-store release,
AI-generated dynamic dialogue, streak-freeze economies, more than two
comets. Every one of these is a comet disguised as a feature.

*First order of business after the re-theme: the export lifeboat, then the
migration. Nothing else touches the log until it can be copied out.*
