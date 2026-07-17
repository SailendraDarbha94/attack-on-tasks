import type { BattleStats } from './titanMath';

// The three captains take notice only of a proven Scout:
// a hundred lesser Titans felled, and at least one boss brought down.
export const CAPTAINS_CHORE_KILLS_REQUIRED = 100;
export const CAPTAINS_BOSS_KILLS_REQUIRED = 1;

export interface CaptainsProgress {
  unlocked: boolean;
  choreKills: number;
  bossKills: number;
}

export function captainsProgress(stats: BattleStats): CaptainsProgress {
  return {
    unlocked:
      stats.choresDone >= CAPTAINS_CHORE_KILLS_REQUIRED &&
      stats.slain >= CAPTAINS_BOSS_KILLS_REQUIRED,
    choreKills: Math.min(stats.choresDone, CAPTAINS_CHORE_KILLS_REQUIRED),
    bossKills: Math.min(stats.slain, CAPTAINS_BOSS_KILLS_REQUIRED),
  };
}
