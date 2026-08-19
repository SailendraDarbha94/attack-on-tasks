import { bodyForHours, type Body } from './bodies';
import { HOUR } from './schedule';
import type { GameEvent, World } from './types';

export const DAY = 24 * HOUR;

// A missed pass costs one pass, never a whole day. For a three-times-a-day
// world that is eight hours, not twenty-four — an honest "not this pass"
// must never quietly cost you the rest of the day.
export function skipDeferMs(periodHours: number): number {
  return Math.min(DAY, periodHours * HOUR);
}

// How long a world takes to drift as far as it can, scaled to its own
// period: five missed passes. A weekly world cannot be as lost in a day as a
// thrice-daily one, which the old flat five-day rule got wrong.
export function driftWindowMs(periodHours: number): number {
  return Math.min(Math.max(5 * periodHours * HOUR, DAY), 30 * DAY);
}

export interface WorldState {
  world: World;
  body: Body;
  due: boolean;
  dueTs: number;
  /** how far past due, in whole days, for copy only */
  lateDays: number;
  /** 0..1 — how far off its ephemeris the world has drifted. Nothing grows. */
  drift: number;
}

export function worlds(
  list: readonly World[],
  events: readonly GameEvent[],
  nowTs: number,
): WorldState[] {
  const lastReturned = new Map<number, number>();
  const lastSkipped = new Map<number, number>();
  for (const event of events) {
    if (event.type === 'chore_completed') {
      lastReturned.set(event.choreId, Math.max(lastReturned.get(event.choreId) ?? 0, event.ts));
    } else if (event.type === 'chore_skipped') {
      lastSkipped.set(event.choreId, Math.max(lastSkipped.get(event.choreId) ?? 0, event.ts));
    }
  }

  return list
    .map((world) => {
      const returned = lastReturned.get(world.id);
      const skipped = lastSkipped.get(world.id);
      let dueTs = returned ? returned + world.frequencyHours * HOUR : world.createdTs;
      if (skipped && (!returned || skipped > returned)) {
        dueTs = Math.max(dueTs, skipped + skipDeferMs(world.frequencyHours));
      }
      const due = nowTs >= dueTs;
      const lateMs = due ? nowTs - dueTs : 0;
      return {
        world,
        body: bodyForHours(world.frequencyHours),
        due,
        dueTs,
        lateDays: Math.floor(lateMs / DAY),
        drift: Math.min(lateMs / driftWindowMs(world.frequencyHours), 1),
      };
    })
    .sort((a, b) => (a.due !== b.due ? (a.due ? -1 : 1) : a.dueTs - b.dueTs));
}
