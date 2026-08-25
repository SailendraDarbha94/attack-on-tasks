import { describe, expect, it } from 'vitest';

import {
  ablation,
  applyAnswer,
  BARE_NUCLEUS_MASS,
  computeGameState,
  initialState,
  LIGHT_FADED_BONUS,
  LIGHT_OBSERVATION,
  LIGHT_RETURN,
  loggingStreak,
  luminosity,
  MAX_MASS,
  SPAWN_MASS,
} from './system';
import { HOUR } from './schedule';
import type { GameEvent, HabitId } from './types';

const minute = (n: number) => n * 60_000;

const faded = (ts: number, habit: HabitId = 'smoke'): GameEvent => ({
  type: 'checkin_answered',
  ts,
  habit,
  answer: 'no',
  slotTs: ts,
});

const flared = (ts: number, habit: HabitId = 'smoke'): GameEvent => ({
  type: 'checkin_answered',
  ts,
  habit,
  answer: 'yes',
  slotTs: ts,
});

const returned = (ts: number): GameEvent => ({ type: 'chore_completed', ts, choreId: 1 });

const disperse = (ts: number, habit: HabitId = 'smoke'): GameEvent => ({
  type: 'titan_killed',
  ts,
  habit,
});

describe('spawn', () => {
  it('both comets arrive at full mass, intact, nucleus not yet bare', () => {
    const state = initialState();
    for (const habit of ['smoke', 'drink'] as const) {
      expect(state.comets[habit]).toEqual({
        habit,
        mass: SPAWN_MASS,
        alive: true,
        finisherReady: false,
      impactReady: false,
      });
    }
    expect(state.light).toBe(0);
    expect(state.luminosity).toBe(luminosity(0));
  });
});

describe('applyAnswer', () => {
  it('a clean answer ablates the nucleus', () => {
    expect(applyAnswer(100, 'no', 1)).toBe(100 - ablation(1));
  });

  it('an outburst adds twice what ablation removes', () => {
    expect(applyAnswer(100, 'yes', 1)).toBe(100 + 2 * ablation(1));
  });

  it('clamps at 0 and MAX_MASS', () => {
    expect(applyAnswer(2, 'no', 50)).toBe(0);
    expect(applyAnswer(MAX_MASS - 1, 'yes', 50)).toBe(MAX_MASS);
  });
});

describe('computeGameState', () => {
  it('gathers light even from an outburst — honesty is the mechanic', () => {
    const state = computeGameState([flared(minute(1))]);
    expect(state.light).toBe(LIGHT_OBSERVATION);
    expect(state.comets.smoke.mass).toBeGreaterThan(SPAWN_MASS);
  });

  it('a clean answer gathers the observation light plus the fade bonus', () => {
    const state = computeGameState([faded(minute(1))]);
    expect(state.light).toBe(LIGHT_OBSERVATION + LIGHT_FADED_BONUS);
    expect(state.comets.smoke.mass).toBeLessThan(SPAWN_MASS);
  });

  it('worlds feed the star: returns raise luminosity, so later answers ablate deeper', () => {
    const bare = computeGameState([faded(minute(30))]);
    const bright = computeGameState([
      ...Array.from({ length: 20 }, (_, i) => returned(minute(i))),
      faded(minute(30)),
    ]);
    const bareCut = SPAWN_MASS - bare.comets.smoke.mass;
    const brightCut = SPAWN_MASS - bright.comets.smoke.mass;
    expect(bright.light).toBe(20 * LIGHT_RETURN + LIGHT_OBSERVATION + LIGHT_FADED_BONUS);
    expect(brightCut).toBeGreaterThan(bareCut);
  });

  it('an unobserved window changes nothing — a busy day is not a failed day', () => {
    const state = computeGameState([
      { type: 'encounter_expired', ts: minute(1), habit: 'smoke', slotTs: minute(1) },
    ]);
    expect(state).toEqual(initialState());
  });

  it('a skipped world changes nothing', () => {
    const state = computeGameState([{ type: 'chore_skipped', ts: minute(1), choreId: 7 }]);
    expect(state).toEqual(initialState());
  });

  it('folds events in timestamp order regardless of input order', () => {
    const shuffled = computeGameState([flared(minute(2)), faded(minute(1))]);
    const ordered = computeGameState([faded(minute(1)), flared(minute(2))]);
    expect(shuffled).toEqual(ordered);
  });

  it('each habit tracks its own comet', () => {
    const state = computeGameState([faded(minute(1), 'smoke'), flared(minute(2), 'drink')]);
    expect(state.comets.smoke.mass).toBeLessThan(SPAWN_MASS);
    expect(state.comets.drink.mass).toBeGreaterThan(SPAWN_MASS);
  });

  it('sustained clean answers bare the nucleus, and perihelion ends it', () => {
    const grind = Array.from({ length: 40 }, (_, i) => faded(minute(i)));
    const spent = computeGameState(grind);
    expect(spent.comets.smoke.mass).toBeLessThanOrEqual(BARE_NUCLEUS_MASS);
    expect(spent.comets.smoke.finisherReady).toBe(true);

    const gone = computeGameState([...grind, disperse(minute(100))]);
    expect(gone.comets.smoke.alive).toBe(false);
    expect(gone.comets.smoke.finisherReady).toBe(false);
  });

  it('perihelion is earned: a dispersal before the nucleus is bare is ignored', () => {
    const state = computeGameState([faded(minute(1)), disperse(minute(2))]);
    expect(state.comets.smoke.alive).toBe(true);
  });

  it('answers logged against a dispersed comet still gather light', () => {
    const grind = Array.from({ length: 40 }, (_, i) => faded(minute(i)));
    const after = [...grind, disperse(minute(100))];
    const state = computeGameState([...after, faded(minute(101))]);
    const reference = computeGameState(after);
    expect(state.comets).toEqual(reference.comets);
    expect(state.light).toBeGreaterThan(reference.light);
  });
});

describe('loggingStreak', () => {
  const day = 24 * HOUR;
  const now = new Date(2026, 0, 20, 18).getTime();

  it('is zero with no observations', () => {
    expect(loggingStreak([], now)).toBe(0);
  });

  it('counts consecutive days with any answer, clean or not', () => {
    const events = [faded(now), flared(now - day), faded(now - 2 * day)];
    expect(loggingStreak(events, now)).toBe(3);
  });

  it('today not being logged yet does not break yesterday run', () => {
    const events = [flared(now - day), faded(now - 2 * day)];
    expect(loggingStreak(events, now)).toBe(2);
  });

  it('a real gap ends the streak', () => {
    const events = [faded(now), faded(now - 3 * day)];
    expect(loggingStreak(events, now)).toBe(1);
  });
});
