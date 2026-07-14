import type { Answer, GameEvent, GameState, HabitId, TitanState } from './types';

export const SPAWN_SIZE = 100;
export const MAX_SIZE = 200;
export const KILL_THRESHOLD = 10;
export const BASE_STRIKE = 5;

// Honesty is the mechanic: every answered check-in earns XP, clean or not.
export const XP_HONESTY = 5;
export const XP_NO_BONUS = 10;
export const XP_CHORE = 15;

export const HABITS: readonly HabitId[] = ['smoke', 'drink'];

export function attackPower(xp: number): number {
  return 1 + Math.floor(Math.sqrt(xp / 10));
}

export function strikeDelta(power: number): number {
  return BASE_STRIKE + power;
}

// Relapse hits twice as hard as abstinence heals — true to life,
// and it keeps the curve honest.
export function applyAnswer(size: number, answer: Answer, power: number): number {
  const delta = strikeDelta(power);
  return answer === 'no'
    ? Math.max(0, size - delta)
    : Math.min(MAX_SIZE, size + 2 * delta);
}

function spawnTitan(habit: HabitId): TitanState {
  return { habit, size: SPAWN_SIZE, alive: true, finisherReady: false };
}

export function initialState(): GameState {
  return {
    titans: { smoke: spawnTitan('smoke'), drink: spawnTitan('drink') },
    xp: 0,
    attackPower: attackPower(0),
  };
}

export function reduceEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'checkin_answered': {
      const titan = state.titans[event.habit];
      if (!titan.alive) return state;
      const xp = state.xp + XP_HONESTY + (event.answer === 'no' ? XP_NO_BONUS : 0);
      const size = applyAnswer(titan.size, event.answer, state.attackPower);
      return withTitan(
        { ...state, xp, attackPower: attackPower(xp) },
        { ...titan, size, finisherReady: size <= KILL_THRESHOLD },
      );
    }
    case 'chore_completed': {
      const xp = state.xp + XP_CHORE;
      return { ...state, xp, attackPower: attackPower(xp) };
    }
    case 'titan_killed': {
      const titan = state.titans[event.habit];
      // The killing blow is earned, not given.
      if (!titan.alive || !titan.finisherReady) return state;
      return withTitan(state, { ...titan, size: 0, alive: false, finisherReady: false });
    }
    case 'encounter_expired':
      // The Titan wandered off — a busy day is not a failed day.
      return state;
  }
}

function withTitan(state: GameState, titan: TitanState): GameState {
  return { ...state, titans: { ...state.titans, [titan.habit]: titan } };
}

export function computeGameState(events: readonly GameEvent[]): GameState {
  return [...events].sort((a, b) => a.ts - b.ts).reduce(reduceEvent, initialState());
}
