import { describe, expect, it } from 'vitest';

import { HOUR } from './schedule';
import {
  computeGameState,
  inboundFragments,
  LIGHT_OBSERVATION,
  RETURN_HOURS,
  returnEvents,
  SPAWN_MASS,
} from './system';
import type { GameEvent } from './types';

// enough clean answers to bare the nucleus, then perihelion
function dispersedAt(ts: number): GameEvent[] {
  const events: GameEvent[] = [];
  for (let i = 0; i < 30; i++) {
    events.push({ type: 'checkin_answered', ts: i, habit: 'smoke', answer: 'no', slotTs: i });
  }
  events.push({ type: 'titan_killed', ts, habit: 'smoke' });
  return events;
}

describe('the urge returns', () => {
  it('no fragment before the window closes', () => {
    const events = dispersedAt(1000);
    expect(returnEvents(events, 1000 + (RETURN_HOURS - 1) * HOUR)).toEqual([]);
    expect(inboundFragments(events, 2000)).toEqual([
      { habit: 'smoke', at: 1000 + RETURN_HOURS * HOUR },
    ]);
  });

  it('materializes a fragment once the window passes, exactly once', () => {
    const events = dispersedAt(1000);
    const due = returnEvents(events, 1000 + RETURN_HOURS * HOUR + 5);
    expect(due).toEqual([
      { type: 'titan_respawned', ts: 1000 + RETURN_HOURS * HOUR, habit: 'smoke' },
    ]);
    const after = events.concat(due);
    expect(returnEvents(after, 1000 + (RETURN_HOURS + 10) * HOUR)).toEqual([]);
    expect(inboundFragments(after, 1000 + (RETURN_HOURS + 10) * HOUR)).toEqual([]);
  });

  it('a returned comet crosses again at full mass', () => {
    const base = dispersedAt(1000);
    const events = base.concat(returnEvents(base, 1000 + RETURN_HOURS * HOUR));
    const state = computeGameState(events);
    expect(state.comets.smoke.alive).toBe(true);
    expect(state.comets.smoke.mass).toBe(SPAWN_MASS);
    expect(state.comets.smoke.finisherReady).toBe(false);
  });

  it('light is still gathered while the comet is gone', () => {
    const events = dispersedAt(1000);
    const before = computeGameState(events);
    const after = computeGameState(
      events.concat([
        { type: 'checkin_answered', ts: 2000, habit: 'smoke', answer: 'yes', slotTs: 2000 },
      ]),
    );
    expect(after.light).toBe(before.light + LIGHT_OBSERVATION);
    expect(after.comets.smoke.alive).toBe(false);
  });
});
