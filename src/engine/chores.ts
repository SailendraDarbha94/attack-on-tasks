import { HOUR } from './schedule';
import type { Chore, GameEvent } from './types';

export const DAY = 24 * HOUR;

// An honest skip defers the titan until tomorrow — never a punishment.
export const SKIP_DEFER_HOURS = 24;

// Overdue chores grow, slightly, and cap out: a mountain of guilt-Titans is
// the failure mode of every to-do app. The forest must never look unwinnable.
export const MENACE_CAP_DAYS = 5;

export interface ChoreTitanState {
  chore: Chore;
  due: boolean;
  dueTs: number;
  overdueDays: number;
  // 0..1 growth factor for how large the titan looms
  menace: number;
}

export function choreTitans(
  chores: readonly Chore[],
  events: readonly GameEvent[],
  nowTs: number,
): ChoreTitanState[] {
  const lastCompleted = new Map<number, number>();
  const lastSkipped = new Map<number, number>();
  for (const event of events) {
    if (event.type === 'chore_completed') {
      lastCompleted.set(event.choreId, Math.max(lastCompleted.get(event.choreId) ?? 0, event.ts));
    } else if (event.type === 'chore_skipped') {
      lastSkipped.set(event.choreId, Math.max(lastSkipped.get(event.choreId) ?? 0, event.ts));
    }
  }

  return chores
    .map((chore) => {
      const done = lastCompleted.get(chore.id);
      const skipped = lastSkipped.get(chore.id);
      let dueTs = done ? done + chore.frequencyHours * HOUR : chore.createdTs;
      if (skipped && (!done || skipped > done)) {
        dueTs = Math.max(dueTs, skipped + SKIP_DEFER_HOURS * HOUR);
      }
      const due = nowTs >= dueTs;
      const overdueDays = due ? Math.floor((nowTs - dueTs) / DAY) : 0;
      return {
        chore,
        due,
        dueTs,
        overdueDays,
        menace: Math.min(overdueDays / MENACE_CAP_DAYS, 1),
      };
    })
    .sort((a, b) => (a.due !== b.due ? (a.due ? -1 : 1) : a.dueTs - b.dueTs));
}
