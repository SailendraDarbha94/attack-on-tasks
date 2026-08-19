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
import { worlds as deriveWorlds } from '@/engine/worlds';
import { expiryEvents, normalizeSettings, pendingEncounters } from '@/engine/schedule';
import { computeGameState, initialState, returnEvents } from '@/engine/system';
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
  trackAsteroid: (name: string, dueTs: number) => Promise<void>;
  deflectAsteroid: (asteroidId: number) => Promise<void>;
  standDownAsteroid: (asteroidId: number) => Promise<void>;
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

  async hydrate() {
    const settings = await loadSettings();
    const startTs = await ensureGameStart();
    const stored = await loadEvents();
    const worlds = await loadWorlds();
    const asteroidsList = await loadAsteroids();
    const now = Date.now();

    const expiries = expiryEvents(stored, startTs, now, settings);
    for (const event of expiries) await appendEvent(event);
    // fragments of dispersed comets that have come back around
    const returns = returnEvents(stored.concat(expiries), now);
    for (const event of returns) await appendEvent(event);
    // deadlines that passed while nobody was looking land at their dueTs
    const strikes = strikeEvents(asteroidsList, stored, now);
    for (const event of strikes) await appendEvent(event);
    const events = stored.concat(expiries, returns, strikes);

    set({
      hydrated: true,
      startTs,
      events,
      settings,
      worlds,
      asteroidsList,
      game: computeGameState(events),
      pending: pendingEncounters(events, startTs, now, settings),
    });

    const inbound = asteroids(asteroidsList, events, now)
      .filter((a) => a.inbound)
      .map((a) => ({ name: a.asteroid.name, dueTs: a.asteroid.dueTs }));
    refreshNotificationSchedule(settings, inbound).catch((err) =>
      console.warn('notification scheduling failed', err),
    );
  },

  async answer(encounter, answer) {
    const event: GameEvent = {
      type: 'checkin_answered',
      ts: Date.now(),
      habit: encounter.habit,
      answer,
      slotTs: encounter.slotTs,
    };
    await appendEvent(event);
    const events = [...get().events, event];
    set({
      events,
      game: computeGameState(events),
      pending: get().pending.filter(
        (p) => !(p.slotTs === encounter.slotTs && p.habit === encounter.habit),
      ),
    });
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
