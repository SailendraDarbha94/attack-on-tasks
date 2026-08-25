import { describe, expect, it } from 'vitest';

import { logbook } from './system';
import type { GameEvent } from './types';

describe('logbook', () => {
  it('counts observations, outbursts, cloud cover, dispersals and returns', () => {
    const events: GameEvent[] = [
      { type: 'checkin_answered', ts: 1, habit: 'smoke', answer: 'no', slotTs: 1 },
      { type: 'checkin_answered', ts: 2, habit: 'drink', answer: 'no', slotTs: 2 },
      { type: 'checkin_answered', ts: 3, habit: 'smoke', answer: 'yes', slotTs: 3 },
      { type: 'encounter_expired', ts: 4, habit: 'drink', slotTs: 4 },
      { type: 'titan_killed', ts: 5, habit: 'smoke' },
      { type: 'chore_completed', ts: 6, choreId: 1 },
      { type: 'asteroid_deflected', ts: 7, asteroidId: 1 },
      { type: 'asteroid_struck', ts: 8, asteroidId: 2 },
    ];
    expect(logbook(events)).toEqual({
      observations: 3,
      clean: 2,
      outbursts: 1,
      unobserved: 1,
      dispersed: 1,
      returns: 1,
      deflected: 1,
      struck: 1,
      impacts: 0,
    });
  });

  it('is all zeroes on an empty log', () => {
    expect(logbook([])).toEqual({
      observations: 0,
      clean: 0,
      outbursts: 0,
      unobserved: 0,
      dispersed: 0,
      returns: 0,
      deflected: 0,
      struck: 0,
      impacts: 0,
    });
  });
});
