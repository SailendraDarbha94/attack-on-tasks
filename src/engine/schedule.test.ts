import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SETTINGS,
  EXPIRY_HOURS,
  expiryEvents,
  HOUR,
  nextSlot,
  normalizeSettings,
  notificationTimes,
  pendingEncounters,
  slotsBetween,
  variantIndex,
} from './schedule';
import type { GameEvent, ScheduleSettings } from './types';

// Local-time helper: day 0 = an arbitrary fixed date, hour/minute local.
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 6, 10 + day, hour, minute).getTime();

const answered = (slotTs: number, habit: 'smoke' | 'drink' = 'smoke'): GameEvent => ({
  type: 'checkin_answered',
  ts: slotTs,
  habit,
  answer: 'no',
  slotTs,
});

describe('slotsBetween', () => {
  it('default settings yield 09/12/15/18/21 local slots', () => {
    expect(slotsBetween(at(0, 0), at(0, 23, 59), DEFAULT_SETTINGS)).toEqual(
      [9, 12, 15, 18, 21].map((h) => at(0, h)),
    );
  });

  it('cadence 2 runs to the inclusive day end', () => {
    const s: ScheduleSettings = { ...DEFAULT_SETTINGS, cadenceHours: 2 };
    expect(slotsBetween(at(0, 0), at(0, 23, 59), s)).toEqual(
      [9, 11, 13, 15, 17, 19, 21, 23].map((h) => at(0, h)),
    );
  });

  it('spans midnight correctly', () => {
    expect(slotsBetween(at(0, 20), at(1, 10), DEFAULT_SETTINGS)).toEqual([at(0, 21), at(1, 9)]);
  });
});

describe('pendingEncounters', () => {
  it('lists unresolved slots for both habits, oldest first', () => {
    expect(pendingEncounters([], at(0, 8), at(0, 13, 30), DEFAULT_SETTINGS)).toEqual([
      { slotTs: at(0, 9), habit: 'smoke' },
      { slotTs: at(0, 9), habit: 'drink' },
      { slotTs: at(0, 12), habit: 'smoke' },
      { slotTs: at(0, 12), habit: 'drink' },
    ]);
  });

  it('an answer resolves exactly one habit at one slot', () => {
    const pending = pendingEncounters(
      [answered(at(0, 9), 'smoke')],
      at(0, 8),
      at(0, 13, 30),
      DEFAULT_SETTINGS,
    );
    expect(pending).toEqual([
      { slotTs: at(0, 9), habit: 'drink' },
      { slotTs: at(0, 12), habit: 'smoke' },
      { slotTs: at(0, 12), habit: 'drink' },
    ]);
  });

  it('slots before the game started never appear', () => {
    const pending = pendingEncounters([], at(0, 11), at(0, 13, 30), DEFAULT_SETTINGS);
    expect(pending).toEqual([
      { slotTs: at(0, 12), habit: 'smoke' },
      { slotTs: at(0, 12), habit: 'drink' },
    ]);
  });

  it('slots older than the expiry window drop out of pending', () => {
    const pending = pendingEncounters([], at(0, 8), at(1, 12), DEFAULT_SETTINGS);
    expect(pending).toEqual([
      { slotTs: at(1, 9), habit: 'smoke' },
      { slotTs: at(1, 9), habit: 'drink' },
      { slotTs: at(1, 12), habit: 'smoke' },
      { slotTs: at(1, 12), habit: 'drink' },
    ]);
  });

  it('disabled habits spawn nothing', () => {
    const s: ScheduleSettings = {
      ...DEFAULT_SETTINGS,
      habitsEnabled: { smoke: true, drink: false },
    };
    const pending = pendingEncounters([], at(0, 8), at(0, 13, 30), s);
    expect(pending.every((p) => p.habit === 'smoke')).toBe(true);
    expect(pending).toHaveLength(2);
  });
});

describe('expiryEvents', () => {
  it('materializes neutral expiries for slots beyond the window', () => {
    const now = at(1, 12);
    const events = expiryEvents([], at(0, 8), now, DEFAULT_SETTINGS);
    // day 0 slots 9..21 all fell out of the 12h window; day 1 slots are pending
    expect(events).toHaveLength(10);
    expect(events.every((e) => e.type === 'encounter_expired' && e.ts === now)).toBe(true);
    const cutoff = now - EXPIRY_HOURS * HOUR;
    expect(
      events.every((e) => e.type === 'encounter_expired' && e.slotTs < cutoff),
    ).toBe(true);
  });

  it('already answered slots do not expire', () => {
    const events = expiryEvents(
      [answered(at(0, 9), 'smoke'), answered(at(0, 9), 'drink')],
      at(0, 8),
      at(1, 12),
      DEFAULT_SETTINGS,
    );
    expect(events).toHaveLength(8);
  });

  it('returns nothing while everything is inside the window', () => {
    expect(expiryEvents([], at(0, 8), at(0, 13, 30), DEFAULT_SETTINGS)).toEqual([]);
  });
});

describe('nextSlot', () => {
  it('finds the next slot today', () => {
    expect(nextSlot(at(0, 13), DEFAULT_SETTINGS)).toBe(at(0, 15));
  });

  it('rolls to tomorrow morning after the last slot', () => {
    expect(nextSlot(at(0, 22), DEFAULT_SETTINGS)).toBe(at(1, 9));
  });
});

describe('notificationTimes', () => {
  it('schedules future slots over the horizon, capped for the iOS limit', () => {
    const times = notificationTimes(at(0, 8), DEFAULT_SETTINGS);
    expect(times.length).toBe(10); // 5 slots/day x 2 days
    expect(times.every((t) => t > at(0, 8))).toBe(true);
    expect(times.length).toBeLessThanOrEqual(60);
  });

  it('schedules nothing when every habit is disabled', () => {
    const s: ScheduleSettings = {
      ...DEFAULT_SETTINGS,
      habitsEnabled: { smoke: false, drink: false },
    };
    expect(notificationTimes(at(0, 8), s)).toEqual([]);
  });
});

describe('variantIndex', () => {
  it('is deterministic and in range', () => {
    for (const slot of [at(0, 9), at(0, 12), at(3, 21), at(30, 15)]) {
      const i = variantIndex(slot, 14);
      expect(i).toBe(variantIndex(slot, 14));
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(14);
    }
  });

  it('spreads across a week of default slots instead of repeating one line', () => {
    const slots = slotsBetween(at(0, 0), at(6, 23, 59), DEFAULT_SETTINGS);
    const seen = new Set(slots.map((s) => variantIndex(s, 14)));
    expect(slots.length).toBe(35);
    expect(seen.size).toBeGreaterThanOrEqual(8);
  });
});

describe('normalizeSettings', () => {
  it('clamps cadence and keeps the day window sane', () => {
    const s = normalizeSettings({
      cadenceHours: 0,
      dayStartHour: 25,
      dayEndHour: 3,
      habitsEnabled: { smoke: true, drink: true },
    });
    expect(s.cadenceHours).toBe(1);
    expect(s.dayStartHour).toBe(22);
    expect(s.dayEndHour).toBe(23);
  });
});
