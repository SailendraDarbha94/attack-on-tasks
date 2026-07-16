import { describe, expect, it } from 'vitest';

import { choreTitans, DAY, MENACE_CAP_DAYS } from './chores';
import { HOUR } from './schedule';
import type { Chore, GameEvent } from './types';

const chore = (id: number, frequencyHours = 24, createdTs = 0): Chore => ({
  id,
  name: `chore-${id}`,
  frequencyHours,
  createdTs,
});

describe('choreTitans', () => {
  it('a fresh chore is due immediately', () => {
    const [state] = choreTitans([chore(1)], [], 1000);
    expect(state.due).toBe(true);
    expect(state.menace).toBe(0);
  });

  it('completion defers the titan by its cadence', () => {
    const events: GameEvent[] = [{ type: 'chore_completed', ts: 10 * HOUR, choreId: 1 }];
    const before = choreTitans([chore(1, 24)], events, 10 * HOUR + 23 * HOUR)[0];
    const after = choreTitans([chore(1, 24)], events, 10 * HOUR + 25 * HOUR)[0];
    expect(before.due).toBe(false);
    expect(after.due).toBe(true);
  });

  it('an honest skip defers until tomorrow, without penalty', () => {
    const events: GameEvent[] = [{ type: 'chore_skipped', ts: 50 * HOUR, choreId: 1 }];
    const during = choreTitans([chore(1)], events, 60 * HOUR)[0];
    const tomorrow = choreTitans([chore(1)], events, 75 * HOUR)[0];
    expect(during.due).toBe(false);
    expect(tomorrow.due).toBe(true);
    expect(tomorrow.menace).toBe(0);
  });

  it('a completion after a skip wins', () => {
    const events: GameEvent[] = [
      { type: 'chore_skipped', ts: 10 * HOUR, choreId: 1 },
      { type: 'chore_completed', ts: 20 * HOUR, choreId: 1 },
    ];
    const state = choreTitans([chore(1, 48)], events, 30 * HOUR)[0];
    expect(state.due).toBe(false);
    expect(state.dueTs).toBe(20 * HOUR + 48 * HOUR);
  });

  it('overdue menace grows daily and caps out', () => {
    const twoDays = choreTitans([chore(1)], [], 2 * DAY)[0];
    const tenDays = choreTitans([chore(1)], [], 10 * DAY)[0];
    expect(twoDays.menace).toBeCloseTo(2 / MENACE_CAP_DAYS);
    expect(tenDays.menace).toBe(1);
  });

  it('due titans sort first, oldest debt first', () => {
    const chores = [chore(1, 24, 5 * DAY), chore(2, 24, 1 * DAY), chore(3, 24, 8 * DAY)];
    const states = choreTitans(chores, [], 6 * DAY);
    expect(states.map((s) => s.chore.id)).toEqual([2, 1, 3]);
    expect(states[2].due).toBe(false);
  });
});
