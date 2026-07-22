export type HabitId = 'smoke' | 'drink';

export type Answer = 'yes' | 'no';

// slotTs identifies which encounter slot an answer/expiry resolves.
export type GameEvent =
  | { type: 'checkin_answered'; ts: number; habit: HabitId; answer: Answer; slotTs: number }
  | { type: 'encounter_expired'; ts: number; habit: HabitId; slotTs: number }
  | { type: 'chore_completed'; ts: number; choreId: number }
  | { type: 'chore_skipped'; ts: number; choreId: number }
  | { type: 'titan_killed'; ts: number; habit: HabitId }
  | { type: 'titan_respawned'; ts: number; habit: HabitId };

export type GameEventType = GameEvent['type'];

export interface TitanState {
  habit: HabitId;
  size: number;
  alive: boolean;
  finisherReady: boolean;
}

export interface GameState {
  titans: Record<HabitId, TitanState>;
  xp: number;
  attackPower: number;
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

export interface Chore {
  id: number;
  name: string;
  frequencyHours: number;
  createdTs: number;
}
