import { describe, expect, it } from 'vitest';

import { HOUR } from './schedule';
import { DAY, driftWindowMs, skipDeferMs, worlds } from './worlds';
import type { GameEvent, World } from './types';

const world = (id: number, frequencyHours = 24, createdTs = 0): World => ({
  id,
  name: `world-${id}`,
  frequencyHours,
  createdTs,
});

describe('worlds', () => {
  it('a fresh world is due immediately, on its ephemeris', () => {
    const [state] = worlds([world(1)], [], 1000);
    expect(state.due).toBe(true);
    expect(state.drift).toBeCloseTo(0, 3);
    expect(state.lateDays).toBe(0);
  });

  it('derives the body from the period', () => {
    expect(worlds([world(1, 8)], [], 0)[0].body.id).toBe('mercury');
    expect(worlds([world(1, 12)], [], 0)[0].body.id).toBe('venus');
    expect(worlds([world(1, 24)], [], 0)[0].body.id).toBe('moon');
    expect(worlds([world(1, 168)], [], 0)[0].body.id).toBe('saturn');
  });

  it('an observation returns it for one full period', () => {
    const events: GameEvent[] = [{ type: 'chore_completed', ts: 10 * HOUR, choreId: 1 }];
    const before = worlds([world(1, 24)], events, 10 * HOUR + 23 * HOUR)[0];
    const after = worlds([world(1, 24)], events, 10 * HOUR + 25 * HOUR)[0];
    expect(before.due).toBe(false);
    expect(after.due).toBe(true);
  });

  it('an honest skip costs one pass and nothing else', () => {
    const events: GameEvent[] = [{ type: 'chore_skipped', ts: 50 * HOUR, choreId: 1 }];
    const during = worlds([world(1)], events, 60 * HOUR)[0];
    const nextDay = worlds([world(1)], events, 75 * HOUR)[0];
    expect(during.due).toBe(false);
    expect(nextDay.due).toBe(true);
    expect(nextDay.drift).toBeLessThan(0.01); // a skip leaves it essentially on-ephemeris
  });

  it('a skip on a thrice-daily world defers one pass, not a whole day', () => {
    expect(skipDeferMs(8)).toBe(8 * HOUR);
    expect(skipDeferMs(24)).toBe(DAY);
    expect(skipDeferMs(168)).toBe(DAY);

    const events: GameEvent[] = [{ type: 'chore_skipped', ts: 0, choreId: 1 }];
    const sameDay = worlds([world(1, 8)], events, 9 * HOUR)[0];
    expect(sameDay.due).toBe(true);
  });

  it('an observation after a skip wins', () => {
    const events: GameEvent[] = [
      { type: 'chore_skipped', ts: 10 * HOUR, choreId: 1 },
      { type: 'chore_completed', ts: 20 * HOUR, choreId: 1 },
    ];
    const state = worlds([world(1, 48)], events, 30 * HOUR)[0];
    expect(state.due).toBe(false);
    expect(state.dueTs).toBe(20 * HOUR + 48 * HOUR);
  });

  it('drift scales to the world own period and caps at 1', () => {
    // five missed passes is fully drifted, whatever the period
    expect(driftWindowMs(24)).toBe(5 * DAY);
    expect(driftWindowMs(168)).toBe(30 * DAY); // clamped
    expect(driftWindowMs(8)).toBe(40 * HOUR); // five 8h passes, above the 24h floor
    expect(driftWindowMs(1)).toBe(DAY); // clamped up to the floor

    const daily = worlds([world(1, 24)], [], 5 * DAY)[0];
    const weekly = worlds([world(1, 168)], [], 5 * DAY)[0];
    expect(daily.drift).toBe(1);
    // the old flat rule wrongly maxed these together
    expect(weekly.drift).toBeLessThan(1);
  });

  it('drift never exceeds 1 no matter how long the gap', () => {
    const ancient = worlds([world(1, 24)], [], 400 * DAY)[0];
    expect(ancient.drift).toBe(1);
  });

  it('due worlds sort first, oldest debt first', () => {
    const list = [world(1, 24, 5 * DAY), world(2, 24, 1 * DAY), world(3, 24, 8 * DAY)];
    const states = worlds(list, [], 6 * DAY);
    expect(states.map((s) => s.world.id)).toEqual([2, 1, 3]);
    expect(states[2].due).toBe(false);
  });
});
