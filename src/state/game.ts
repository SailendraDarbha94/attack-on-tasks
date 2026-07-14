import { create } from 'zustand';

import { appendEvent, ensureGameStart, loadEvents, loadSettings, saveSettings } from '@/db';
import { expiryEvents, normalizeSettings, pendingEncounters } from '@/engine/schedule';
import { computeGameState, initialState } from '@/engine/titanMath';
import type {
  Answer,
  GameEvent,
  GameState,
  HabitId,
  PendingEncounter,
  ScheduleSettings,
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
  hydrate: () => Promise<void>;
  answer: (encounter: PendingEncounter, answer: Answer) => Promise<void>;
  updateSettings: (patch: SettingsPatch) => Promise<void>;
}

export const useGame = create<GameStore>()((set, get) => ({
  hydrated: false,
  startTs: 0,
  events: [],
  game: initialState(),
  settings: DEFAULT_SETTINGS,
  pending: [],

  async hydrate() {
    const settings = await loadSettings();
    const startTs = await ensureGameStart();
    const stored = await loadEvents();
    const now = Date.now();

    const expiries = expiryEvents(stored, startTs, now, settings);
    for (const event of expiries) await appendEvent(event);
    const events = stored.concat(expiries);

    set({
      hydrated: true,
      startTs,
      events,
      settings,
      game: computeGameState(events),
      pending: pendingEncounters(events, startTs, now, settings),
    });

    refreshNotificationSchedule(settings).catch((err) =>
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

  async updateSettings(patch) {
    const previous = get().settings;
    const settings = normalizeSettings({
      ...previous,
      ...patch,
      habitsEnabled: { ...previous.habitsEnabled, ...(patch.habitsEnabled ?? {}) },
    });
    await saveSettings(settings);
    const { events, startTs } = get();
    set({ settings, pending: pendingEncounters(events, startTs, Date.now(), settings) });
    refreshNotificationSchedule(settings).catch((err) =>
      console.warn('notification scheduling failed', err),
    );
  },
}));
