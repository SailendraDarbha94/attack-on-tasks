import { describe, expect, it } from 'vitest';

import { HOUR } from './schedule';
import {
  computeGameState,
  pendingRespawns,
  RESPAWN_HOURS,
  respawnEvents,
  SPAWN_SIZE,
  XP_HONESTY,
} from './titanMath';
import type { GameEvent } from './types';

// enough clean strikes to earn the finisher, then the blow itself
function killedAt(ts: number): GameEvent[] {
  const events: GameEvent[] = [];
  for (let i = 0; i < 30; i++) {
    events.push({ type: 'checkin_answered', ts: i, habit: 'smoke', answer: 'no', slotTs: i });
  }
  events.push({ type: 'titan_killed', ts, habit: 'smoke' });
  return events;
}

describe('respawn', () => {
  it('does not respawn before the timer', () => {
    const events = killedAt(1000);
    expect(respawnEvents(events, 1000 + (RESPAWN_HOURS - 1) * HOUR)).toEqual([]);
    expect(pendingRespawns(events, 2000)).toEqual([
      { habit: 'smoke', at: 1000 + RESPAWN_HOURS * HOUR },
    ]);
  });

  it('materializes a respawn once the timer passes, exactly once', () => {
    const events = killedAt(1000);
    const due = respawnEvents(events, 1000 + RESPAWN_HOURS * HOUR + 5);
    expect(due).toEqual([
      { type: 'titan_respawned', ts: 1000 + RESPAWN_HOURS * HOUR, habit: 'smoke' },
    ]);
    const after = events.concat(due);
    expect(respawnEvents(after, 1000 + (RESPAWN_HOURS + 10) * HOUR)).toEqual([]);
    expect(pendingRespawns(after, 1000 + (RESPAWN_HOURS + 10) * HOUR)).toEqual([]);
  });

  it('a respawned titan walks again at spawn size', () => {
    const events = killedAt(1000).concat(
      respawnEvents(killedAt(1000), 1000 + RESPAWN_HOURS * HOUR),
    );
    const state = computeGameState(events);
    expect(state.titans.smoke.alive).toBe(true);
    expect(state.titans.smoke.size).toBe(SPAWN_SIZE);
    expect(state.titans.smoke.finisherReady).toBe(false);
  });

  it('honesty still earns XP while the titan lies slain', () => {
    const events = killedAt(1000);
    const before = computeGameState(events);
    const after = computeGameState(
      events.concat([
        { type: 'checkin_answered', ts: 2000, habit: 'smoke', answer: 'yes', slotTs: 2000 },
      ]),
    );
    expect(after.xp).toBe(before.xp + XP_HONESTY);
    expect(after.titans.smoke.alive).toBe(false);
  });
});
