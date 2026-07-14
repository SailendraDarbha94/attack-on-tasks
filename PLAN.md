# Attack on Tasks — Build Plan

> I wake up in the Forest of the Giant Trees just outside Wall Maria, wearing
> the garb of the Scout Regiment. Every couple of hours, Titans emerge from
> the wilderness. Whether they grow or fall depends on what I did with my
> hands in the hours before.

A personal, single-player habit game for iPhone. The Smoking Titan and the
Drinking Titan are the bosses. Chores are the lesser Titans. The player wins
by living well, two hours at a time.

---

## Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Stack | Expo React Native + TypeScript | Already known; local notifications; one codebase |
| Visuals | Static illustrations + motion effects (Reanimated) | 90% of the emotional payoff, 10% of the effort, upgradeable later |
| Data | Local-only, on-device SQLite | No accounts, no server, private by construction |
| Audience | Just me, personal iPhone | Full AoT flavor is fine — never publish this version to a store |
| Schedule | Bursty | Every chapter is sliced into sessions that end shippable |

**IP note:** Attack on Titan names, characters, and imagery stay legal only
because this never leaves your device. If the app ever wants an audience,
that's a re-theming project (original giants, original names), not a legal
gray area to drift into.

---

## Design pillars

1. **The Titan must be alive between check-ins.** Its size is persistent
   state you carry around. Opening the app and seeing the Smoking Titan
   *smaller than last week* is the product.
2. **Relapse keeps you in the game.** If answering "yes, I smoked" feels
   like humiliation, you will stop opening the app — the same abandonment
   loop as every task app before it. A "yes" makes the Titan grow and gloat,
   but the Scout survives: the narration always ends on re-engagement
   ("It grows. But you have gas in the tanks and blades left. Two hours.").
   Never zero out all progress on one bad answer.
3. **The killing blow is earned, not given.** Titans don't die from one good
   afternoon. Sustained abstinence shrinks them toward a threshold; crossing
   it unlocks the finisher (and later, the real-time battle is *that*
   finisher). The game mechanic and the actual life goal are the same curve.
4. **Every build session ends with a working app on the phone.** Bursty
   schedule rule: no half-finished refactors at the end of a session. If a
   feature can't land whole, it lands behind a flag or waits.
5. **Dogfood from Chapter 1.** You are the only user. The app must be on
   your phone and answering real check-ins before any further chapter gets
   built — using it *is* the requirements-gathering.

---

## Core loop (MVP spec)

### Encounters
- Local scheduled notifications during waking hours (default: every 3h,
  09:00–23:00; configurable). Each notification is a Titan emerging.
- Tapping opens the **Encounter screen**: Titan illustration, its taunt
  line, one question — *"Have you smoked in the last few hours?"* — with
  YES / NO.
- **NO** → strike animation (flash, shake, steam burst, haptic), Titan
  shrinks, size bar drops, XP gained.
- **YES** → Titan grows, delivers its line ("Cheers mate! Soon I'll have
  some Scout Regiment blood in me bottle"), walks off. Re-engagement
  narration. No streak apocalypse.
- **Missed encounters linger.** If you open the app hours later, pending
  Titans are waiting in the forest, answerable in order. Unanswered
  encounters older than ~12h expire as "the Titan wandered off" (neutral —
  neither growth nor shrink — so a busy day isn't a punished day).

### Titan state
- Each habit Titan has `size` (say 0–200, spawns at 100).
- NO: −Δ where Δ scales with your attack power. YES: +2Δ (relapse hits
  harder than abstinence heals — true to life, and it keeps the curve
  honest).
- Size hitting the kill threshold (~10) unlocks the finisher: a full-screen
  kill sequence, the Titan is gone, a story beat plays, and a stronger
  variant may eventually respawn ("the urge returns, changed") — because
  that is also true to life.

### Attack power & XP
- XP from every honest answer (yes or no — honesty is the mechanic),
  bigger XP from NOs and from chores.
- Attack power rises with XP → later NOs carve bigger chunks off the
  bosses. This is the thread that ties Chapter 2's chores back into
  Chapter 1's war: folding laundry literally sharpens the blades you use
  on the Smoking Titan.

---

## Architecture

```
app/                    expo-router routes
  (forest)/index.tsx    home: the forest, lingering Titans, size bars
  encounter/[id].tsx    encounter screen
  chores/               chore list + add/edit
  journal/              history & stats (later chapter)
src/
  db/                   expo-sqlite + migrations
  engine/               pure TS: titan math, streaks, encounter scheduling
  state/                zustand stores (UI state only)
  content/              taunt lines, narration beats, story text
  assets/titans/        illustrations (normal / grown / hit / dying variants)
```

- **Event-sourced core.** One append-only `events` table is the source of
  truth: `(id, timestamp, type, payload)` — `checkin_answered`,
  `chore_completed`, `encounter_expired`, `titan_killed`… Titan sizes,
  streaks, XP, and attack power are all *derived* by pure functions in
  `src/engine/`. Balance changes and bug fixes never corrupt history; you
  just recompute.
- **`src/engine/` has zero React imports** and gets the only unit tests
  that matter in this project (titan math, expiry rules, scheduling).
- Tables besides `events`: `chores` (name, frequency, flavor) and a small
  `settings` KV. Everything else is derived.

### Key packages
`expo-router`, `expo-sqlite`, `expo-notifications`, `expo-dev-client`,
`react-native-reanimated`, `lottie-react-native`, `expo-haptics`,
`expo-audio`, `zustand`.

### Animation approach (locked)
Four layers, no custom-authored character animation anywhere:

1. **Static art variants** — one base illustration per boss, then 3–4 pose
   variants derived via image-editing generation (idle, gloating/grown,
   flinching, dying) so the character stays consistent.
2. **Reanimated choreography** — subtle breathing scale-loop on idle,
   ease-out grow on YES, shake + white flash + size drop on NO.
3. **Stock Lottie effect overlays** (LottieFiles marketplace) for the money
   moments — slash arc + steam burst on a hit, glass-shatter when Pixis's
   bottle breaks. Effects only; never a character.
4. **Haptics + sound** under everything — a heavy impact on the blow sells
   "I struck a Titan" more than extra animation frames would.

Rule: authoring character animation (After Effects/Lottie rigging) is
off-limits — it's a weeks-long tooling cliff unrelated to shipping. If the
Titans feel flat after a month of real use, the upgrade path is a Rive
state-machine rig replacing layer 1 only; layers 2–4 and everything else
survive unchanged.

### Two traps to respect
- **Notifications:** go straight to a development build
  (`expo-dev-client`). Expo Go's notification support is partial and will
  mislead you. iOS caps pending scheduled local notifications at 64 —
  schedule a rolling ~2 days ahead and refresh the schedule on every app
  open, driven by the engine, not by 64 hand-placed timers.
- **Missed-encounter logic lives in the engine, not the notification
  layer.** On every app open: compute expected encounters since last open
  from the schedule, diff against answered ones, materialize the lingering
  Titans. Notifications are just doorbells; the engine is the clock.

---

## Chapters

Sized in **sessions** (one session ≈ a 2–4h sitting), because weeks are
meaningless on a bursty schedule.

### Chapter 0 — Donning the gear (1–2 sessions)
Scaffold: Expo app w/ TypeScript, expo-router, dark forest theme, SQLite +
migrations, empty engine with its first unit test, dev build **installed on
your iPhone**. Milestone: the app icon is on your home screen.

### Chapter 1 — The Two Titans (4–6 sessions) ← the MVP
1. Engine: events table, titan math, encounter schedule + expiry (pure TS,
   tested).
2. Encounter screen: static Titan art, taunt, YES/NO, grow/shrink animation
   with haptics.
3. Notifications: rolling schedule, tap-through to encounter, quiet hours.
4. Forest home screen: both bosses at current size, size bars, XP, next
   encounter countdown.
5. Settings: cadence, waking hours, per-habit toggles.
6. Art pass: generate/collect 3–4 variants per boss Titan.

**Milestone: you live with the app for two full weeks before building
anything else.** This dogfooding gate is deliberate — cadence, tone, and
the relapse experience will all be wrong in ways only real use reveals.

### Chapter 2 — The Other Titans (3–5 sessions)
Chores as lesser Titans: add/edit with frequency (daily, every 2 days, …),
they spawn into the forest when due and linger; completing the chore = kill
animation + XP + attack power up. Overdue chores grow slightly but cap out —
a mountain of guilt-Titans is the failure mode of every to-do app; the forest
must never look unwinnable. Milestone: laundry Titan dies on laundry day, and
its XP visibly sharpens your blows against the bosses.

### Chapter 3 — Consequences & ceremony (3–4 sessions)
The meta-game: story beats at size thresholds, the earned finisher sequence
for a boss at kill threshold, capture-and-reset narrative if a boss maxes
out (story resets; XP/attack power survive — the Scout remembers), sound
design, a stats/journal screen (size-over-time chart is the real trophy),
optional iOS home-screen widget showing boss sizes (non-trivial in Expo;
strictly optional).

### Chapter 4 — The real-time battle (someday, honestly)
The ODM-gear, tether-swinging, nape-strike battle:
- **4a (achievable in RN):** a timing/gesture mini-game finisher — swipe
  chains, dodge windows, a nape-strike QTE with Reanimated. Genuinely
  satisfying, ships in a few sessions, and only plays when a Titan is at
  kill threshold — the finisher you *earned*.
- **4b (aspirational):** true 3D maneuvering. Be honest with yourself: this
  is a game-dev project (react-three-fiber at the optimistic end, a
  separate Godot/Unity build at the realistic end), months of work, and it
  should only be started if the habit loop has already proven itself for a
  few months. Park it. It loses nothing by waiting.

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
| Builder's motivation > user's motivation (your own diagnosis) | Chapter 1 dogfooding gate; app on phone by session 2; every session ends shippable |
| Notification fatigue → resentment → uninstall | Configurable cadence, quiet hours, neutral expiry for missed encounters |
| Shame spiral on relapse → avoidance → abandonment | Pillar 2: "yes" always ends on re-engagement; no total resets |
| Dishonest answers hollow out the game | XP for honesty itself; no cloud, no witnesses — the game only ever plays against you |
| 7-day signing expiry kills the app mid-week | Resolved — paid developer account already in hand |
| Scope creep toward the 3D battle | Chapter 4b is explicitly parked behind months of proven habit-loop use |

---

## Not building (yet, or ever)

Accounts/auth, cloud sync, social features, Android, app-store release,
AI-generated dynamic dialogue, streak-freeze economies, more than two boss
Titans. Every one of these is a Titan disguised as a feature.

*First order of business: Chapter 0, Session 1 — `npx create-expo-app`,
and the gear goes on.*
