import { describe, expect, it } from 'vitest';

import { captainsProgress } from './captains';
import type { BattleStats } from './titanMath';

const stats = (choresDone: number, slain: number): BattleStats => ({
  answered: 0,
  strikes: 0,
  relapses: 0,
  expired: 0,
  slain,
  choresDone,
});

describe('captainsProgress', () => {
  it('stays locked below either threshold', () => {
    expect(captainsProgress(stats(99, 1)).unlocked).toBe(false);
    expect(captainsProgress(stats(100, 0)).unlocked).toBe(false);
    expect(captainsProgress(stats(0, 0)).unlocked).toBe(false);
  });

  it('unlocks at 100 chore kills and one boss kill', () => {
    expect(captainsProgress(stats(100, 1)).unlocked).toBe(true);
    expect(captainsProgress(stats(250, 2)).unlocked).toBe(true);
  });

  it('clamps progress display at the requirements', () => {
    const p = captainsProgress(stats(250, 2));
    expect(p.choreKills).toBe(100);
    expect(p.bossKills).toBe(1);
  });
});
