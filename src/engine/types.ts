// The two comets name real habits, not a theme. These strings are written
// into the event log, so they never change.
export type HabitId = 'smoke' | 'drink';

export type Answer = 'yes' | 'no';

// slotTs identifies which observation window an answer/expiry resolves.
//
// NOTE: the 'titan_*' type strings are legacy. They are written verbatim in
// the real on-device log, so renaming them means a data migration, not an
// edit. Until that migration ships they stay exactly as they are.
export type GameEvent =
  | { type: 'checkin_answered'; ts: number; habit: HabitId; answer: Answer; slotTs: number }
  | { type: 'encounter_expired'; ts: number; habit: HabitId; slotTs: number }
  | { type: 'chore_completed'; ts: number; choreId: number }
  | { type: 'chore_skipped'; ts: number; choreId: number }
  | { type: 'titan_killed'; ts: number; habit: HabitId }
  | { type: 'titan_respawned'; ts: number; habit: HabitId }
  | { type: 'asteroid_deflected'; ts: number; asteroidId: number }
  | { type: 'asteroid_struck'; ts: number; asteroidId: number };

export type GameEventType = GameEvent['type'];

export interface CometState {
  habit: HabitId;
  /** volatile mass remaining, 0–200 */
  mass: number;
  alive: boolean;
  /** volatiles spent — the nucleus is bare and perihelion will finish it */
  finisherReady: boolean;
}

export interface GameState {
  comets: Record<HabitId, CometState>;
  /** total light gathered from honest observations and returned worlds */
  light: number;
  /** your star's output; drives how fast a comet ablates */
  luminosity: number;
  /** the people of the home planet — grown by work, dented by strikes */
  population: number;
  /** fold-internal: last observation timestamp, for the streak multiplier */
  lastObservationTs: number | null;
  /** consecutive observation days as of the last observation */
  observationStreak: number;
}

export interface ScheduleSettings {
  cadenceHours: number;
  dayStartHour: number;
  dayEndHour: number;
  habitsEnabled: Record<HabitId, boolean>;
}

export interface PendingEncounter {
  slotTs: number;
  habit: HabitId;
}

// A one-off obligation with a deadline. It is inbound from the moment it is
// tracked; deflect it by doing the work before dueTs, or it strikes home.
export interface Asteroid {
  id: number;
  name: string;
  dueTs: number;
  createdTs: number;
}

// A practice you keep. Its period decides which world carries it, and the
// world is derived — never stored — so a period change moves the world and
// keeps the history.
export interface World {
  id: number;
  name: string;
  frequencyHours: number;
  createdTs: number;
}
