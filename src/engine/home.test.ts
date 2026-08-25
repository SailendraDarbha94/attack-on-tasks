import { describe, expect, it } from 'vitest';

import { asteroids, strikeEvents } from './asteroids';
import { BODIES, EARTH } from './bodies';
import { HOUR } from './schedule';
import {
  computeGameState,
  FRAGMENT_MAX_MASS,
  FRAGMENT_MIN_MASS,
  impactEvents,
  MAX_MASS,
  POPULATION_FLOOR,
  POPULATION_PER_TASK,
  POPULATION_START,
  returnEvents,
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

describe('earthfall', () => {
  // Enough outbursts to drive mass from spawn to the ceiling, whatever the
  // luminosity curve does along the way.
  const outbursts = (n: number): GameEvent[] =>
    Array.from({ length: n }, (_, i) => ({
      type: 'checkin_answered',
      ts: 1000 + i * HOUR,
      habit: 'smoke',
      answer: 'yes',
      slotTs: 1000 + i * HOUR,
    }));

  it('mass at the ceiling arms the impact', () => {
    const state = computeGameState(outbursts(12));
    const comet = state.comets.smoke;
    expect(comet.mass).toBe(MAX_MASS);
    expect(comet.impactReady).toBe(true);
    expect(comet.alive).toBe(true);
  });

  it('materializes exactly one impact, at the crossing answer, and is idempotent', () => {
    const events = outbursts(12);
    const impacts = impactEvents(events, 1000);
    expect(impacts).toHaveLength(1);
    expect(impacts[0].type).toBe('comet_struck_home');
    // the crossing happened before the final outburst — the ts must not be
    // the last event's just because materialization ran later
    expect(impacts[0].ts).toBeLessThanOrEqual(events[events.length - 1].ts);
    expect(impactEvents(events.concat(impacts), 1000)).toEqual([]);
  });

  it('the ark bypasses the strike floor: population becomes exactly the ark', () => {
    const events = outbursts(12);
    const impacts = impactEvents(events, 1000);
    const state = computeGameState(events.concat(impacts));
    expect(state.population).toBe(1000);
    expect(state.population).toBeLessThan(POPULATION_FLOOR);
    expect(state.comets.smoke.alive).toBe(false);
    expect(state.comets.smoke.impactReady).toBe(false);
  });

  it('a fragment of the fallen comet is inbound 72 hours later', () => {
    const events = outbursts(12);
    const impacts = impactEvents(events, 1000);
    const all = events.concat(impacts);
    const impactTs = impacts[0].ts;
    const respawns = returnEvents(all, impactTs + 73 * HOUR);
    expect(respawns).toHaveLength(1);
    expect(respawns[0].ts).toBe(impactTs + 72 * HOUR);
    const forming = computeGameState(all).comets.smoke.mass;
    const after = computeGameState(all.concat(respawns));
    expect(after.comets.smoke.alive).toBe(true);
    // the fragment returns at exactly what it accreted while forming
    expect(after.comets.smoke.mass).toBe(forming);
    expect(after.comets.smoke.mass).toBeGreaterThanOrEqual(100);
  });

  it('a strike after the fall cannot heal the world up to the old floor', () => {
    const events = outbursts(12);
    const impacts = impactEvents(events, 1000);
    const struck = computeGameState(
      events.concat(impacts, [
        { type: 'asteroid_struck', ts: impacts[0].ts + HOUR, asteroidId: 9 },
      ]),
    );
    expect(struck.population).toBe(1000);
  });

  it('the forming fragment eats outbursts and starves on clean answers', () => {
    // outbursts after the crossing already feed the fragment — measure from
    // that baseline, with the extra answer safely after every fixture event
    const events = outbursts(12);
    const impacts = impactEvents(events, 1000);
    const base = computeGameState(events.concat(impacts)).comets.smoke.mass;
    const late = events[events.length - 1].ts + 10 * HOUR;
    const answerAt = (answer: 'yes' | 'no'): GameEvent => ({
      type: 'checkin_answered',
      ts: late,
      habit: 'smoke',
      answer,
      slotTs: late,
    });
    const fed = computeGameState(events.concat(impacts, [answerAt('yes')]));
    expect(fed.comets.smoke.alive).toBe(false);
    expect(fed.comets.smoke.mass).toBeGreaterThan(base);
    const starved = computeGameState(events.concat(impacts, [answerAt('no')]));
    expect(starved.comets.smoke.mass).toBeLessThan(base);
  });

  it('forming mass clamps: never below the core, never already falling', () => {
    const events = outbursts(12);
    const impacts = impactEvents(events, 1000);
    const t0 = impacts[0].ts;
    const feast: GameEvent[] = Array.from({ length: 40 }, (_, i) => ({
      type: 'checkin_answered',
      ts: t0 + (i + 1) * HOUR,
      habit: 'smoke',
      answer: 'yes',
      slotTs: t0 + (i + 1) * HOUR,
    }));
    const fast: GameEvent[] = feast.map((e) => ({ ...e, answer: 'no' as const }));
    expect(computeGameState(events.concat(impacts, feast)).comets.smoke.mass).toBe(
      FRAGMENT_MAX_MASS,
    );
    expect(computeGameState(events.concat(impacts, fast)).comets.smoke.mass).toBe(
      FRAGMENT_MIN_MASS,
    );
  });

  it('the fragment returns at whatever it accreted', () => {
    const events = outbursts(12);
    const impacts = impactEvents(events, 1000);
    const t0 = impacts[0].ts;
    const all = events.concat(impacts, [
      { type: 'checkin_answered', ts: t0 + HOUR, habit: 'smoke', answer: 'yes', slotTs: t0 + HOUR },
    ]);
    const respawns = returnEvents(all, t0 + 73 * HOUR);
    const after = computeGameState(all.concat(respawns));
    expect(after.comets.smoke.alive).toBe(true);
    expect(after.comets.smoke.mass).toBeGreaterThan(100);
    expect(after.comets.smoke.impactReady).toBe(false);
  });

  it('growth resumes from the ark after the fall', () => {
    const events = outbursts(12);
    const impacts = impactEvents(events, 1000);
    const rebuilt = computeGameState(
      events.concat(impacts, [ret(impacts[0].ts + 2 * HOUR)]),
    );
    expect(rebuilt.population).toBe(1000 + POPULATION_PER_TASK);
  });
});
