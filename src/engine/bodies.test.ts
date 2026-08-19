import { describe, expect, it } from 'vitest';

import { BODIES, BODY_BY_ID, bodyForHours } from './bodies';

describe('bodyForHours', () => {
  it('maps every canonical cadence to its own world', () => {
    for (const body of BODIES) {
      expect(bodyForHours(body.hours).id).toBe(body.id);
    }
  });

  it('honours the founding mapping', () => {
    expect(bodyForHours(8).id).toBe('mercury'); // three times a day
    expect(bodyForHours(12).id).toBe('venus'); // twice a day
    expect(bodyForHours(24).id).toBe('moon'); // every day — Earth is home, the Moon keeps the dailies
  });

  it('snaps by threshold, so no hour value is ever unassigned', () => {
    for (let h = 1; h <= 2000; h++) {
      const body = bodyForHours(h);
      expect(BODY_BY_ID[body.id]).toBeDefined();
    }
  });

  it('clamps beyond both ends of the table', () => {
    expect(bodyForHours(1).id).toBe('mercury');
    expect(bodyForHours(0).id).toBe('mercury');
    expect(bodyForHours(100_000).id).toBe('neptune');
  });

  it('is monotonic: a longer period never moves inward', () => {
    let last = 0;
    for (let h = 1; h <= 2000; h++) {
      const index = BODIES.findIndex((b) => b.id === bodyForHours(h).id);
      expect(index).toBeGreaterThanOrEqual(last);
      last = index;
    }
  });

  it('rejects nothing: non-finite input still yields a world', () => {
    expect(bodyForHours(Number.NaN).id).toBe('moon');
    expect(bodyForHours(Number.POSITIVE_INFINITY).id).toBe('neptune');
  });
});
