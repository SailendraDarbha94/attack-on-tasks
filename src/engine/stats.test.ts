import { describe, expect, it } from 'vitest';

import { battleStats } from './titanMath';
import type { GameEvent } from './types';

describe('battleStats', () => {
  it('counts strikes, relapses, expiries and kills', () => {
    const events: GameEvent[] = [
      { type: 'checkin_answered', ts: 1, habit: 'smoke', answer: 'no', slotTs: 1 },
      { type: 'checkin_answered', ts: 2, habit: 'drink', answer: 'no', slotTs: 2 },
      { type: 'checkin_answered', ts: 3, habit: 'smoke', answer: 'yes', slotTs: 3 },
      { type: 'encounter_expired', ts: 4, habit: 'drink', slotTs: 4 },
      { type: 'titan_killed', ts: 5, habit: 'smoke' },
      { type: 'chore_completed', ts: 6, choreId: 1 },
    ];
    expect(battleStats(events)).toEqual({
      answered: 3,
      strikes: 2,
      relapses: 1,
      expired: 1,
      slain: 1,
      choresDone: 1,
    });
  });

  it('is all zeroes on an empty log', () => {
    expect(battleStats([])).toEqual({
      answered: 0,
      strikes: 0,
      relapses: 0,
      expired: 0,
      slain: 0,
      choresDone: 0,
    });
  });
});
