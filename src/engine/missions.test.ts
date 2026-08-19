import { describe, expect, it } from 'vitest';

import { missionsProgress } from './missions';
import type { Logbook } from './system';

const log = (returns: number, dispersed: number): Logbook => ({
  observations: 0,
  clean: 0,
  outbursts: 0,
  unobserved: 0,
  dispersed,
  returns,
  deflected: 0,
  struck: 0,
});

describe('missionsProgress', () => {
  it('stays locked below either threshold', () => {
    expect(missionsProgress(log(99, 1)).unlocked).toBe(false);
    expect(missionsProgress(log(100, 0)).unlocked).toBe(false);
    expect(missionsProgress(log(0, 0)).unlocked).toBe(false);
  });

  it('unlocks at 100 returns and one dispersal', () => {
    expect(missionsProgress(log(100, 1)).unlocked).toBe(true);
    expect(missionsProgress(log(250, 2)).unlocked).toBe(true);
  });

  it('clamps progress display at the requirements', () => {
    const p = missionsProgress(log(250, 2));
    expect(p.returns).toBe(100);
    expect(p.dispersed).toBe(1);
  });
});
