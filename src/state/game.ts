import { create } from 'zustand';

import {
  appendEvent,
  archiveAsteroid,
  archiveWorld,
  ensureGameStart,
  insertAsteroid,
  insertWorld,
  loadAsteroids,
  loadEvents,
  loadSettings,
  loadWorlds,
  saveSettings,
} from '@/db';
import { asteroids, strikeEvents } from '@/engine/asteroids';
import { getSetting, setSetting } from '@/db';
import { worlds as deriveWorlds } from '@/engine/worlds';
import { expiryEvents, normalizeSettings, pendingEncounters } from '@/engine/schedule';
import { computeGameState, impactEvents, initialState, returnEvents } from '@/engine/system';
import type {
  Answer,
  Asteroid,
  GameEvent,
  GameState,
  HabitId,
  PendingEncounter,
  ScheduleSettings,
  World,
} from '@/engine/types';
import { DEFAULT_SETTINGS } from '@/engine/schedule';
import { refreshNotificationSchedule } from '@/notifications/scheduler';

type SettingsPatch = Partial<Omit<ScheduleSettings, 'habitsEnabled'>> & {
  habitsEnabled?: Partial<Record<HabitId, boolean>>;
};

interface GameStore {
  hydrated: boolean;
  startTs: number;
  events: GameEvent[];
  game: GameState;
  settings: ScheduleSettings;
  pending: PendingEncounter[];
  worlds: World[];
  asteroidsList: Asteroid[];
  hydrate: () => Promise<void>;
  answer: (encounter: PendingEncounter, answer: Answer) => Promise<void>;
  updateSettings: (patch: SettingsPatch) => Promise<void>;
  commissionWorld: (name: string, frequencyHours: number) => Promise<void>;
  returnWorld: (worldId: number) => Promise<void>;
  skipWorld: (worldId: number) => Promise<void>;
  releaseWorld: (worldId: number) => Promise<void>;
  disperseComet: (habit: HabitId) => Promise<void>;
  /** an Earthfall that has not yet been shown to the player */
  pendingImpact: { habit: HabitId; ark: number; before: number; ts: number } | null;
  acknowledgeImpact: () => void;
  trackAsteroid: (name: string, dueTs: number) => Promise<void>;
  deflectAsteroid: (asteroidId: number) => Promise<void>;
  standDownAsteroid: (asteroidId: number) => Promise<void>;
}

// answer() reads the event list, derives an impact, and writes both — two
// interleaved calls each miss the other's write. One chain serializes them.
let answerChain: Promise<unknown> = Promise.resolve();
let hydrating: Promise<void> | null = null;
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = answerChain.then(fn, fn);
  answerChain = next.catch(() => undefined);
  return next;
}

export const useGame = create<GameStore>()((set, get) => ({
  hydrated: false,
  startTs: 0,
  events: [],
  game: initialState(),
  settings: DEFAULT_SETTINGS,
  pending: [],
  worlds: [],
  asteroidsList: [],
  pendingImpact: null,

  async hydrate() {
    if (hydrating) return hydrating;
    hydrating = (async () => {
    const settings = await loadSettings();
    const startTs = await ensureGameStart();
    const stored = await loadEvents();
    const worlds = await loadWorlds();
    let asteroidsList = await loadAsteroids();
    const now = Date.now();

    // Double-tap twins: one tap's race once inserted the same obligation
    // twice. Rows with the same name and deadline, born within seconds of
    // each other, form one cluster: whatever the player resolved is history
    // and stays; of the unresolved echoes, the first survives, the rest are
    // archived before they can strike on their own.
    const resolvedIds = new Set<number>();
    for (const e of stored) {
      if (e.type === 'asteroid_deflected' || e.type === 'asteroid_struck') {
        resolvedIds.add(e.asteroidId);
      }
    }
    const bySignature = new Map<string, typeof asteroidsList>();
    for (const a of [...asteroidsList].sort((x, y) => x.createdTs - y.createdTs)) {
      const key = `${a.name}|${a.dueTs}`;
      const group = bySignature.get(key);
      if (group) group.push(a);
      else bySignature.set(key, [a]);
    }
    const kept: typeof asteroidsList = [];
    for (const group of bySignature.values()) {
      let cluster: typeof asteroidsList = [];
      const settle = async () => {
        if (cluster.length > 1) {
          const anyResolved = cluster.some((a) => resolvedIds.has(a.id));
          let keeperTaken = anyResolved;
          for (const a of cluster) {
            if (resolvedIds.has(a.id)) kept.push(a);
            else if (!keeperTaken) {
              keeperTaken = true;
              kept.push(a);
            } else await archiveAsteroid(a.id);
          }
        } else kept.push(...cluster);
        cluster = [];
      };
      for (const a of group) {
        if (cluster.length && a.createdTs - cluster[cluster.length - 1].createdTs >= 3000) {
          await settle();
        }
        cluster.push(a);
      }
      await settle();
    }
    asteroidsList = kept.sort((x, y) => x.dueTs - y.dueTs);

    const expiries = expiryEvents(stored, startTs, now, settings);
    for (const event of expiries) await appendEvent(event);
    // deadlines that passed while nobody was looking land at their dueTs
    const strikes = strikeEvents(asteroidsList, stored, now);
    for (const event of strikes) await appendEvent(event);
    // an Earthfall the app crashed out of before writing lands now — and it
    // must land BEFORE returns, so a fall older than 72h respawns this
    // session, not next launch
    const impacts = impactEvents(stored.concat(expiries, strikes), settings.arkSouls);
    for (const event of impacts) await appendEvent(event);
    // fragments of dispersed comets that have come back around
    const returns = returnEvents(stored.concat(expiries, strikes, impacts), now);
    for (const event of returns) await appendEvent(event);
    const events = stored.concat(expiries, strikes, impacts, returns);

    // any Earthfall the player has not yet been shown — however old
    const seenTs = Number((await getSetting('impact_seen_ts')) ?? 0);
    const chronological = [...events].sort((a, b) => a.ts - b.ts);
    let pendingImpact: GameStore['pendingImpact'] = null;
    for (let i = chronological.length - 1; i >= 0; i--) {
      const e = chronological[i];
      if (e.type === 'comet_struck_home' && e.ts > seenTs) {
        pendingImpact = {
          habit: e.habit,
          ark: e.ark,
          before: computeGameState(chronological.slice(0, i)).population,
          ts: e.ts,
        };
        break;
      }
    }
    set({
      hydrated: true,
      startTs,
      events,
      settings,
      worlds,
      asteroidsList,
      game: computeGameState(events),
      pending: pendingEncounters(events, startTs, now, settings),
      pendingImpact,
    });

    const inbound = asteroids(asteroidsList, events, now)
      .filter((a) => a.inbound)
      .map((a) => ({ name: a.asteroid.name, dueTs: a.asteroid.dueTs }));
    refreshNotificationSchedule(settings, inbound).catch((err) =>
      console.warn('notification scheduling failed', err),
    );
    })();
    try {
      await hydrating;
    } finally {
      hydrating = null;
    }
  },

  answer(encounter, answer) {
    return serialized(async () => {
      const event: GameEvent = {
        type: 'checkin_answered',
        ts: Date.now(),
        habit: encounter.habit,
        answer,
        slotTs: encounter.slotTs,
      };
      const beforePopulation = get().game.population;
      await appendEvent(event);
      let events = [...get().events, event];
      const impacts = impactEvents(events, get().settings.arkSouls);
      for (const impact of impacts) await appendEvent(impact);
      events = events.concat(impacts);
      const impact = impacts.find((e) => e.type === 'comet_struck_home');
      set({
        events,
        game: computeGameState(events),
        pending: get().pending.filter(
          (p) => !(p.slotTs === encounter.slotTs && p.habit === encounter.habit),
        ),
        ...(impact
          ? {
              pendingImpact: {
                habit: impact.habit,
                ark: impact.ark,
                before: beforePopulation,
                ts: impact.ts,
              },
            }
          : {}),
      });
    });
  },

  acknowledgeImpact() {
    const seen = get().pendingImpact;
    if (seen) setSetting('impact_seen_ts', String(seen.ts)).catch(() => {});
    set({ pendingImpact: null });
  },

  async commissionWorld(name, frequencyHours) {
    const world = await insertWorld(name.trim(), frequencyHours);
    set({ worlds: [...get().worlds, world] });
  },

  async returnWorld(worldId) {
    // a world that is already on its ephemeris has nothing to log — this is
    // the guard that keeps light and population honest
    const { worlds: list, events: current } = get();
    const state = deriveWorlds(list, current, Date.now()).find((w) => w.world.id === worldId);
    if (!state?.due) return;
    const event: GameEvent = { type: 'chore_completed', ts: Date.now(), choreId: worldId };
    await appendEvent(event);
    const events = [...get().events, event];
    set({ events, game: computeGameState(events) });
  },

  async skipWorld(worldId) {
    const { worlds: list, events: current } = get();
    const state = deriveWorlds(list, current, Date.now()).find((w) => w.world.id === worldId);
    if (!state?.due) return;
    const event: GameEvent = { type: 'chore_skipped', ts: Date.now(), choreId: worldId };
    await appendEvent(event);
    set({ events: [...get().events, event] });
  },

  async releaseWorld(worldId) {
    await archiveWorld(worldId);
    set({ worlds: get().worlds.filter((w) => w.id !== worldId) });
  },

  async trackAsteroid(name, dueTs) {
    const asteroid = await insertAsteroid(name.trim(), dueTs);
    set({ asteroidsList: [...get().asteroidsList, asteroid] });
  },

  async deflectAsteroid(asteroidId) {
    const event: GameEvent = { type: 'asteroid_deflected', ts: Date.now(), asteroidId };
    await appendEvent(event);
    const events = [...get().events, event];
    set({ events, game: computeGameState(events) });
  },

  async standDownAsteroid(asteroidId) {
    // for mistakes only: an untracked asteroid neither strikes nor deflects
    await archiveAsteroid(asteroidId);
    set({ asteroidsList: get().asteroidsList.filter((a) => a.id !== asteroidId) });
  },

  async disperseComet(habit) {
    // the engine reducer guards this: no bare nucleus, no perihelion
    const event: GameEvent = { type: 'titan_killed', ts: Date.now(), habit };
    await appendEvent(event);
    const events = [...get().events, event];
    set({ events, game: computeGameState(events) });
  },

  async updateSettings(patch) {
    const previous = get().settings;
    const settings = normalizeSettings({
      ...previous,
      ...patch,
      habitsEnabled: { ...previous.habitsEnabled, ...(patch.habitsEnabled ?? {}) },
    });
    await saveSettings(settings);
    const { events, startTs, asteroidsList } = get();
    const now = Date.now();
    set({ settings, pending: pendingEncounters(events, startTs, now, settings) });
    const inbound = asteroids(asteroidsList, events, now)
      .filter((a) => a.inbound)
      .map((a) => ({ name: a.asteroid.name, dueTs: a.asteroid.dueTs }));
    refreshNotificationSchedule(settings, inbound).catch((err) =>
      console.warn('notification scheduling failed', err),
    );
  },
}));
