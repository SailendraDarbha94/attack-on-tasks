import { HOUR } from './schedule';
import type { Answer, GameEvent, GameState, HabitId, TitanState } from './types';

export const SPAWN_SIZE = 100;
export const MAX_SIZE = 200;
export const KILL_THRESHOLD = 10;
export const BASE_STRIKE = 5;

// The killing blow is earned — but the urge returns. Three quiet days,
// then the titan walks out of the treeline again.
export const RESPAWN_HOURS = 72;

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
      // honesty is XP even while the titan lies slain — the question outlives it
      const xp = state.xp + XP_HONESTY + (event.answer === 'no' ? XP_NO_BONUS : 0);
      const next = { ...state, xp, attackPower: attackPower(xp) };
      if (!titan.alive) return next;
      const size = applyAnswer(titan.size, event.answer, state.attackPower);
      return withTitan(next, { ...titan, size, finisherReady: size <= KILL_THRESHOLD });
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
    case 'titan_respawned': {
      const titan = state.titans[event.habit];
      if (titan.alive) return state;
      return withTitan(state, spawnTitan(event.habit));
    }
    case 'encounter_expired':
    case 'chore_skipped':
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

// per-habit timestamp of the latest kill that has not yet respawned
function unrespawnedKills(events: readonly GameEvent[]): Map<HabitId, number> {
  const killed = new Map<HabitId, number>();
  for (const event of events) {
    if (event.type === 'titan_killed') killed.set(event.habit, event.ts);
    else if (event.type === 'titan_respawned') killed.delete(event.habit);
  }
  return killed;
}

// Materialize due respawns on app open — same pattern as encounter expiry:
// notifications are doorbells, the engine is the clock.
export function respawnEvents(events: readonly GameEvent[], nowTs: number): GameEvent[] {
  const out: GameEvent[] = [];
  for (const [habit, killTs] of unrespawnedKills(events)) {
    if (nowTs - killTs >= RESPAWN_HOURS * HOUR) {
      out.push({ type: 'titan_respawned', ts: killTs + RESPAWN_HOURS * HOUR, habit });
    }
  }
  return out;
}

// Slain titans whose return is still in the future, for the countdown.
export function pendingRespawns(
  events: readonly GameEvent[],
  nowTs: number,
): { habit: HabitId; at: number }[] {
  const out: { habit: HabitId; at: number }[] = [];
  for (const [habit, killTs] of unrespawnedKills(events)) {
    const at = killTs + RESPAWN_HOURS * HOUR;
    if (at > nowTs) out.push({ habit, at });
  }
  return out.sort((a, b) => a.at - b.at);
}

export interface BattleStats {
  answered: number;
  strikes: number;
  relapses: number;
  expired: number;
  slain: number;
  choresDone: number;
}

export function battleStats(events: readonly GameEvent[]): BattleStats {
  const stats: BattleStats = {
    answered: 0,
    strikes: 0,
    relapses: 0,
    expired: 0,
    slain: 0,
    choresDone: 0,
  };
  for (const event of events) {
    switch (event.type) {
      case 'checkin_answered':
        stats.answered += 1;
        if (event.answer === 'no') stats.strikes += 1;
        else stats.relapses += 1;
        break;
      case 'encounter_expired':
        stats.expired += 1;
        break;
      case 'titan_killed':
        stats.slain += 1;
        break;
      case 'chore_completed':
        stats.choresDone += 1;
        break;
    }
  }
  return stats;
}
