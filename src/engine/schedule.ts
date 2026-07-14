import { HABITS } from './titanMath';
import type { GameEvent, PendingEncounter, ScheduleSettings } from './types';

export const HOUR = 3_600_000;

// Unanswered encounters older than this expire neutrally —
// a busy day is not a failed day.
export const EXPIRY_HOURS = 12;

export const DEFAULT_SETTINGS: ScheduleSettings = {
  cadenceHours: 3,
  dayStartHour: 9,
  dayEndHour: 23,
  habitsEnabled: { smoke: true, drink: true },
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function normalizeSettings(s: ScheduleSettings): ScheduleSettings {
  const cadenceHours = clamp(Math.round(s.cadenceHours), 1, 12);
  const dayStartHour = clamp(Math.round(s.dayStartHour), 0, 22);
  const dayEndHour = clamp(Math.round(s.dayEndHour), dayStartHour + 1, 23);
  return { ...s, cadenceHours, dayStartHour, dayEndHour };
}

// Slots run at local dayStartHour, stepping cadenceHours, while <= dayEndHour.
function slotsOnDay(year: number, month: number, date: number, s: ScheduleSettings): number[] {
  const slots: number[] = [];
  for (let h = s.dayStartHour; h <= s.dayEndHour; h += s.cadenceHours) {
    slots.push(new Date(year, month, date, h).getTime());
  }
  return slots;
}

export function slotsBetween(fromTs: number, toTs: number, s: ScheduleSettings): number[] {
  const out: number[] = [];
  const first = new Date(fromTs);
  for (let i = 0; ; i++) {
    const day = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
    if (day.getTime() > toTs) break;
    for (const slot of slotsOnDay(day.getFullYear(), day.getMonth(), day.getDate(), s)) {
      if (slot >= fromTs && slot <= toTs) out.push(slot);
    }
  }
  return out;
}

function resolvedKeys(events: readonly GameEvent[]): Set<string> {
  const keys = new Set<string>();
  for (const e of events) {
    if (e.type === 'checkin_answered' || e.type === 'encounter_expired') {
      keys.add(`${e.slotTs}|${e.habit}`);
    }
  }
  return keys;
}

// Unresolved slots still inside the expiry window — the Titans lingering
// in the forest, oldest first.
export function pendingEncounters(
  events: readonly GameEvent[],
  sinceTs: number,
  nowTs: number,
  s: ScheduleSettings,
): PendingEncounter[] {
  const seen = resolvedKeys(events);
  const from = Math.max(sinceTs, nowTs - EXPIRY_HOURS * HOUR);
  const out: PendingEncounter[] = [];
  for (const slotTs of slotsBetween(from, nowTs, s)) {
    for (const habit of HABITS) {
      if (!s.habitsEnabled[habit]) continue;
      if (!seen.has(`${slotTs}|${habit}`)) out.push({ slotTs, habit });
    }
  }
  return out;
}

// Neutral expiry events to materialize for slots that fell out of the window.
export function expiryEvents(
  events: readonly GameEvent[],
  sinceTs: number,
  nowTs: number,
  s: ScheduleSettings,
): GameEvent[] {
  const seen = resolvedKeys(events);
  const cutoff = nowTs - EXPIRY_HOURS * HOUR;
  if (cutoff <= sinceTs) return [];
  const out: GameEvent[] = [];
  for (const slotTs of slotsBetween(sinceTs, cutoff, s)) {
    if (slotTs >= cutoff) continue; // boundary slot is still pending
    for (const habit of HABITS) {
      if (!s.habitsEnabled[habit]) continue;
      if (!seen.has(`${slotTs}|${habit}`)) {
        out.push({ type: 'encounter_expired', ts: nowTs, habit, slotTs });
      }
    }
  }
  return out;
}

export function nextSlot(nowTs: number, s: ScheduleSettings): number | null {
  return slotsBetween(nowTs + 1, nowTs + 48 * HOUR, s)[0] ?? null;
}

// Rolling local-notification schedule. iOS caps pending notifications at 64,
// so we schedule a bounded horizon and refresh on every app open.
export function notificationTimes(
  nowTs: number,
  s: ScheduleSettings,
  horizonHours = 48,
): number[] {
  if (!HABITS.some((h) => s.habitsEnabled[h])) return [];
  return slotsBetween(nowTs + 60_000, nowTs + horizonHours * HOUR, s).slice(0, 60);
}
