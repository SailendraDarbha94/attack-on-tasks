import type { Logbook } from './system';

// Three long-duration missions only take notice of a keeper with a record:
// a hundred worlds returned on time, and at least one comet dispersed.
export const MISSIONS_RETURNS_REQUIRED = 100;
export const MISSIONS_COMET_REQUIRED = 1;

export interface MissionsProgress {
  unlocked: boolean;
  returns: number;
  dispersed: number;
}

export function missionsProgress(log: Logbook): MissionsProgress {
  return {
    unlocked:
      log.returns >= MISSIONS_RETURNS_REQUIRED && log.dispersed >= MISSIONS_COMET_REQUIRED,
    returns: Math.min(log.returns, MISSIONS_RETURNS_REQUIRED),
    dispersed: Math.min(log.dispersed, MISSIONS_COMET_REQUIRED),
  };
}
