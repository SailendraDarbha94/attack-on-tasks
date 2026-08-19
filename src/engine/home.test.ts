import { describe, expect, it } from 'vitest';

import { asteroids, strikeEvents } from './asteroids';
import { BODIES, EARTH } from './bodies';
import { HOUR } from './schedule';
import {
  computeGameState,
  POPULATION_FLOOR,
  POPULATION_PER_TASK,
  POPULATION_START,
  STREAK_MULT_CAP,
  streakMultiplier,
  STRIKE_LOSS,
} from './system';
import type { Asteroid, GameEvent } from './types';

const DAY = 24 * HOUR;

const rock = (id: number, dueTs: number, createdTs = 0): Asteroid => ({
  id,
  name: `rock-${id}`,
  dueTs,
  createdTs,
});

const ret = (ts: number): GameEvent => ({ type: 'chore_completed', ts, choreId: 1 });
const obs = (ts: number): GameEvent => ({
  type: 'checkin_answered',
  ts,
  habit: 'smoke',
  answer: 'no',
  slotTs: ts,
});

describe('earth is home, not a cadence body', () => {
  it('the cadence table has no earth and the moon holds 24h', () => {
    expect(BODIES.find((b) => b.id === 'earth')).toBeUndefined();
    expect(BODIES.find((b) => b.hours === 24)?.id).toBe('moon');
    expect(EARTH.id).toBe('earth');
  });
});

describe('asteroids', () => {
  it('an unresolved asteroid is inbound with progress toward impact', () => {
    const state = asteroids([rock(1, 100 * HOUR, 0)], [], 50 * HOUR)[0];
    expect(state.inbound).toBe(true);
    expect(state.progress).toBeCloseTo(0.5, 5);
    expect(state.msToImpact).toBe(50 * HOUR);
  });

  it('deflection resolves it and progress clamps', () => {
    const events: GameEvent[] = [{ type: 'asteroid_deflected', ts: 60 * HOUR, asteroidId: 1 }];
    const state = asteroids([rock(1, 100 * HOUR)], events, 200 * HOUR)[0];
    expect(state.inbound).toBe(false);
    expect(state.outcome).toBe('deflected');
    expect(state.progress).toBe(1);
  });

  it('a passed deadline materializes exactly one strike, at dueTs', () => {
    const list = [rock(1, 100 * HOUR)];
    const due = strikeEvents(list, [], 101 * HOUR);
    expect(due).toEqual([{ type: 'asteroid_struck', ts: 100 * HOUR, asteroidId: 1 }]);
    expect(strikeEvents(list, due, 200 * HOUR)).toEqual([]);
  });

  it('a deflected asteroid never strikes, even after its deadline', () => {
    const events: GameEvent[] = [{ type: 'asteroid_deflected', ts: 50 * HOUR, asteroidId: 1 }];
    expect(strikeEvents([rock(1, 100 * HOUR)], events, 200 * HOUR)).toEqual([]);
  });
});

describe('population', () => {
  it('starts at the founding number', () => {
    expect(computeGameState([]).population).toBe(POPULATION_START);
  });

  it('grows by the task grant on returns and deflections', () => {
    const state = computeGameState([
      ret(1000),
      { type: 'asteroid_deflected', ts: 2000, asteroidId: 1 },
    ]);
    expect(state.population).toBe(POPULATION_START + 2 * POPULATION_PER_TASK);
  });

  it('a strike costs bounded population', () => {
    const state = computeGameState([{ type: 'asteroid_struck', ts: 1000, asteroidId: 1 }]);
    expect(state.population).toBe(POPULATION_START - STRIKE_LOSS);
  });

  it('no run of strikes takes population below the floor', () => {
    const hail: GameEvent[] = Array.from({ length: 100 }, (_, i) => ({
      type: 'asteroid_struck',
      ts: i,
      asteroidId: i,
    }));
    expect(computeGameState(hail).population).toBe(POPULATION_FLOOR);
  });

  it('the logging streak multiplies growth', () => {
    const base = new Date(2026, 0, 5, 12).getTime();
    // observe on three consecutive days, then return a world
    const events: GameEvent[] = [
      obs(base),
      obs(base + DAY),
      obs(base + 2 * DAY),
      ret(base + 2 * DAY + HOUR),
    ];
    const state = computeGameState(events);
    expect(state.observationStreak).toBe(3);
    expect(state.population).toBe(POPULATION_START + 3 * POPULATION_PER_TASK);
  });

  it('a broken streak resets the multiplier to 1', () => {
    const base = new Date(2026, 0, 5, 12).getTime();
    const events: GameEvent[] = [obs(base), obs(base + 3 * DAY), ret(base + 3 * DAY + HOUR)];
    const state = computeGameState(events);
    expect(state.observationStreak).toBe(1);
    expect(state.population).toBe(POPULATION_START + POPULATION_PER_TASK);
  });

  it('the multiplier caps', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(3)).toBe(3);
    expect(streakMultiplier(500)).toBe(STREAK_MULT_CAP);
  });
});
