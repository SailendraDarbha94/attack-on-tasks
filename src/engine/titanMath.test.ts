import { describe, expect, it } from 'vitest';

import {
  applyAnswer,
  attackPower,
  computeGameState,
  initialState,
  KILL_THRESHOLD,
  MAX_SIZE,
  SPAWN_SIZE,
  strikeDelta,
  XP_CHORE,
  XP_HONESTY,
  XP_NO_BONUS,
} from './titanMath';
import type { GameEvent, HabitId } from './types';

const minute = (n: number) => n * 60_000;

const no = (ts: number, habit: HabitId = 'smoke'): GameEvent => ({
  type: 'checkin_answered',
  ts,
  habit,
  answer: 'no',
  slotTs: ts,
});

const yes = (ts: number, habit: HabitId = 'smoke'): GameEvent => ({
  type: 'checkin_answered',
  ts,
  habit,
  answer: 'yes',
  slotTs: ts,
});

const chore = (ts: number): GameEvent => ({ type: 'chore_completed', ts, choreId: 1 });

const kill = (ts: number, habit: HabitId = 'smoke'): GameEvent => ({
  type: 'titan_killed',
  ts,
  habit,
});

describe('spawn', () => {
  it('both bosses spawn at full size, alive, finisher locked', () => {
    const state = initialState();
    for (const habit of ['smoke', 'drink'] as const) {
      expect(state.titans[habit]).toEqual({
        habit,
        size: SPAWN_SIZE,
        alive: true,
        finisherReady: false,
      });
    }
    expect(state.xp).toBe(0);
    expect(state.attackPower).toBe(attackPower(0));
  });
});

describe('applyAnswer', () => {
  it('NO shrinks the titan by the strike delta', () => {
    expect(applyAnswer(100, 'no', 1)).toBe(100 - strikeDelta(1));
  });

  it('YES grows the titan twice as hard as NO heals', () => {
    expect(applyAnswer(100, 'yes', 1)).toBe(100 + 2 * strikeDelta(1));
  });

  it('clamps at 0 and MAX_SIZE', () => {
    expect(applyAnswer(2, 'no', 50)).toBe(0);
    expect(applyAnswer(MAX_SIZE - 1, 'yes', 50)).toBe(MAX_SIZE);
  });
});

describe('computeGameState', () => {
  it('accrues honesty XP even on a relapse answer', () => {
    const state = computeGameState([yes(minute(1))]);
    expect(state.xp).toBe(XP_HONESTY);
    expect(state.titans.smoke.size).toBeGreaterThan(SPAWN_SIZE);
  });

  it('a clean answer earns honesty XP plus the NO bonus', () => {
    const state = computeGameState([no(minute(1))]);
    expect(state.xp).toBe(XP_HONESTY + XP_NO_BONUS);
    expect(state.titans.smoke.size).toBeLessThan(SPAWN_SIZE);
  });

  it('chores sharpen the blades: XP from chores makes later strikes carve deeper', () => {
    const bare = computeGameState([no(minute(30))]);
    const trained = computeGameState([
      ...Array.from({ length: 20 }, (_, i) => chore(minute(i))),
      no(minute(30)),
    ]);
    const bareCut = SPAWN_SIZE - bare.titans.smoke.size;
    const trainedCut = SPAWN_SIZE - trained.titans.smoke.size;
    expect(trained.xp).toBe(20 * XP_CHORE + XP_HONESTY + XP_NO_BONUS);
    expect(trainedCut).toBeGreaterThan(bareCut);
  });

  it('an expired encounter changes nothing — a busy day is not a failed day', () => {
    const state = computeGameState([
      { type: 'encounter_expired', ts: minute(1), habit: 'smoke', slotTs: minute(1) },
    ]);
    expect(state).toEqual(initialState());
  });

  it('folds events in timestamp order regardless of input order', () => {
    const shuffled = computeGameState([yes(minute(2)), no(minute(1))]);
    const ordered = computeGameState([no(minute(1)), yes(minute(2))]);
    expect(shuffled).toEqual(ordered);
  });

  it('each habit fights its own titan', () => {
    const state = computeGameState([no(minute(1), 'smoke'), yes(minute(2), 'drink')]);
    expect(state.titans.smoke.size).toBeLessThan(SPAWN_SIZE);
    expect(state.titans.drink.size).toBeGreaterThan(SPAWN_SIZE);
  });

  it('sustained NOs unlock the finisher, and the kill ends the titan', () => {
    const grind = Array.from({ length: 40 }, (_, i) => no(minute(i)));
    const weakened = computeGameState(grind);
    expect(weakened.titans.smoke.size).toBeLessThanOrEqual(KILL_THRESHOLD);
    expect(weakened.titans.smoke.finisherReady).toBe(true);

    const slain = computeGameState([...grind, kill(minute(100))]);
    expect(slain.titans.smoke.alive).toBe(false);
    expect(slain.titans.smoke.finisherReady).toBe(false);
  });

  it('the killing blow is earned: a kill event before the threshold is ignored', () => {
    const state = computeGameState([no(minute(1)), kill(minute(2))]);
    expect(state.titans.smoke.alive).toBe(true);
  });

  it('answers aimed at a dead titan still earn honesty XP but move no size', () => {
    const grind = Array.from({ length: 40 }, (_, i) => no(minute(i)));
    const afterKill = [...grind, kill(minute(100))];
    const state = computeGameState([...afterKill, no(minute(101))]);
    const reference = computeGameState(afterKill);
    expect(state.titans).toEqual(reference.titans);
    expect(state.xp).toBeGreaterThan(reference.xp);
  });
});
