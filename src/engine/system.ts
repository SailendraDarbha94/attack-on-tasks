import { HOUR } from './time';
import type { Answer, GameEvent, GameState, CometState, HabitId } from './types';

// A comet's mass is what you are working against. Every number here is
// unchanged from the first version of this game — only the words moved.
export const SPAWN_MASS = 100;
export const MAX_MASS = 200;
export const BARE_NUCLEUS_MASS = 10;
export const BASE_ABLATION = 5;
// An Earthfall fragment forms in the dark and eats what you do while it is
// away — but it always comes back at least a core, and never already falling.
export const FRAGMENT_MIN_MASS = 40;
export const FRAGMENT_MAX_MASS = 180;

// A dispersed comet is not the end of anything. Another fragment of the same
// parent arrives three days later, which is how sungrazers work and how
// urges work.
export const RETURN_HOURS = 72;

// Honesty is the mechanic: every answered observation gathers light, clean
// or not. A clean one gathers more.
export const LIGHT_OBSERVATION = 5;
export const LIGHT_FADED_BONUS = 10;
export const LIGHT_RETURN = 15;

export const HABITS: readonly HabitId[] = ['smoke', 'drink'];

// The home planet's people. Work grows them, strikes dent them — bounded on
// both sides: the multiplier caps so numbers stay human, and no run of
// strikes can take the population below the floor. Nothing ever zeroes.
export const POPULATION_START = 100_000;
export const POPULATION_FLOOR = 10_000;
export const POPULATION_PER_TASK = 2_000;
export const STRIKE_LOSS = 5_000;
export const STREAK_MULT_CAP = 10;

const DAY_MS = 24 * HOUR; // safe: './time' is a leaf module

const dayKey = (ts: number) => new Date(ts).toDateString();

/** The population multiplier the streak has earned, 1..STREAK_MULT_CAP. */
export function streakMultiplier(observationStreak: number): number {
  return Math.min(Math.max(observationStreak, 1), STREAK_MULT_CAP);
}

/** Your star's output. Gathered light makes it burn brighter. */
export function luminosity(light: number): number {
  return 1 + Math.floor(Math.sqrt(light / 10));
}

/** How much volatile mass a single clean observation boils off. */
export function ablation(power: number): number {
  return BASE_ABLATION + power;
}

// An outburst adds twice what ablation removes — comets observably do this,
// and so does life. The asymmetry is physics, not punishment.
export function applyAnswer(mass: number, answer: Answer, power: number): number {
  const delta = ablation(power);
  return answer === 'no' ? Math.max(0, mass - delta) : Math.min(MAX_MASS, mass + 2 * delta);
}

function spawnComet(habit: HabitId): CometState {
  return { habit, mass: SPAWN_MASS, alive: true, finisherReady: false, impactReady: false };
}

export function initialState(): GameState {
  return {
    comets: { smoke: spawnComet('smoke'), drink: spawnComet('drink') },
    light: 0,
    luminosity: luminosity(0),
    population: POPULATION_START,
    lastObservationTs: null,
    observationStreak: 0,
  };
}

function grow(state: GameState): Pick<GameState, 'population'> {
  return {
    population: state.population + POPULATION_PER_TASK * streakMultiplier(state.observationStreak),
  };
}

export function reduceEvent(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'checkin_answered': {
      const comet = state.comets[event.habit];
      // light is gathered even while the comet is dispersed — the question
      // outlives it
      const light = state.light + LIGHT_OBSERVATION + (event.answer === 'no' ? LIGHT_FADED_BONUS : 0);
      // the observation-day streak, tracked in the fold so the population
      // multiplier is correct at each event's own moment in history
      const prev = state.lastObservationTs;
      const observationStreak =
        prev !== null && dayKey(prev) === dayKey(event.ts)
          ? state.observationStreak
          : prev !== null && dayKey(prev + DAY_MS) === dayKey(event.ts)
            ? state.observationStreak + 1
            : 1;
      const next = {
        ...state,
        light,
        luminosity: luminosity(light),
        lastObservationTs: event.ts,
        observationStreak,
      };
      if (!comet.alive) {
        // an honorably spent comet (mass 0) stays spent; a FALLEN one left a
        // forming fragment out there, and it eats what you do while it forms
        if (comet.mass <= 0) return next;
        const forming = Math.min(
          FRAGMENT_MAX_MASS,
          Math.max(FRAGMENT_MIN_MASS, applyAnswer(comet.mass, event.answer, state.luminosity)),
        );
        return withComet(next, { ...comet, mass: forming });
      }
      const mass = applyAnswer(comet.mass, event.answer, state.luminosity);
      return withComet(next, {
        ...comet,
        mass,
        finisherReady: mass <= BARE_NUCLEUS_MASS,
        // the ceiling is a threshold, not a wall: crossing it is Earthfall,
        // which materializes as its own event
        impactReady: mass >= MAX_MASS,
      });
    }
    case 'chore_completed': {
      const light = state.light + LIGHT_RETURN;
      return { ...state, light, luminosity: luminosity(light), ...grow(state) };
    }
    case 'asteroid_deflected': {
      const light = state.light + LIGHT_RETURN;
      return { ...state, light, luminosity: luminosity(light), ...grow(state) };
    }
    case 'asteroid_struck': {
      // bounded: a strike leaves a crater in the record, never a hole in the
      // will to keep going — and after an Earthfall, when the world stands
      // below the old floor, a strike must never HEAL it up to that floor
      const floor = Math.min(POPULATION_FLOOR, state.population);
      return { ...state, population: Math.max(floor, state.population - STRIKE_LOSS) };
    }
    case 'comet_struck_home': {
      const comet = state.comets[event.habit];
      if (!comet.alive) return state;
      // Earthfall: the one loss the floor does not soften. The ark number is
      // captured in the event itself, so history never re-reads settings.
      return {
        ...withComet(state, {
          ...comet,
          mass: SPAWN_MASS,
          alive: false,
          finisherReady: false,
          impactReady: false,
        }),
        population: Math.max(1, event.ark),
      };
    }
    case 'titan_killed': {
      // legacy event name, kept verbatim: it is written in the real log
      const comet = state.comets[event.habit];
      // perihelion is earned, not given
      if (!comet.alive || !comet.finisherReady) return state;
      return withComet(state, { ...comet, mass: 0, alive: false, finisherReady: false });
    }
    case 'titan_respawned': {
      const comet = state.comets[event.habit];
      if (comet.alive) return state;
      const mass = comet.mass > 0 ? comet.mass : SPAWN_MASS;
      return withComet(state, { ...spawnComet(event.habit), mass });
    }
    case 'encounter_expired':
    case 'chore_skipped':
      // cloud cover, or a pass missed. Neither is a fault and neither moves
      // anything: a busy day is not a failed day.
      return state;
  }
}

function withComet(state: GameState, comet: CometState): GameState {
  return { ...state, comets: { ...state.comets, [comet.habit]: comet } };
}

export function computeGameState(events: readonly GameEvent[]): GameState {
  return [...events].sort((a, b) => a.ts - b.ts).reduce(reduceEvent, initialState());
}

export interface Logbook {
  observations: number;
  clean: number;
  outbursts: number;
  unobserved: number;
  dispersed: number;
  returns: number;
  deflected: number;
  struck: number;
  impacts: number;
}

export function logbook(events: readonly GameEvent[]): Logbook {
  const log: Logbook = {
    observations: 0,
    clean: 0,
    outbursts: 0,
    unobserved: 0,
    dispersed: 0,
    returns: 0,
    deflected: 0,
    impacts: 0,
    struck: 0,
  };
  for (const event of events) {
    switch (event.type) {
      case 'checkin_answered':
        log.observations += 1;
        if (event.answer === 'no') log.clean += 1;
        else log.outbursts += 1;
        break;
      case 'encounter_expired':
        log.unobserved += 1;
        break;
      case 'titan_killed':
        log.dispersed += 1;
        break;
      case 'chore_completed':
        log.returns += 1;
        break;
      case 'asteroid_deflected':
        log.deflected += 1;
        break;
      case 'comet_struck_home':
        log.impacts += 1;
        break;
      case 'asteroid_struck':
        log.struck += 1;
        break;
    }
  }
  return log;
}

// per-habit timestamp of the latest dispersal that has no fragment yet
function openDispersals(events: readonly GameEvent[]): Map<HabitId, number> {
  const dispersed = new Map<HabitId, number>();
  for (const event of events) {
    if (event.type === 'titan_killed' || event.type === 'comet_struck_home')
      dispersed.set(event.habit, event.ts);
    else if (event.type === 'titan_respawned') dispersed.delete(event.habit);
  }
  return dispersed;
}

// Materialize due returns on app open — notifications are doorbells, the
// engine is the clock.
export function returnEvents(events: readonly GameEvent[], nowTs: number): GameEvent[] {
  const out: GameEvent[] = [];
  for (const [habit, dispersedTs] of openDispersals(events)) {
    if (nowTs - dispersedTs >= RETURN_HOURS * HOUR) {
      out.push({ type: 'titan_respawned', ts: dispersedTs + RETURN_HOURS * HOUR, habit });
    }
  }
  return out;
}

/**
 * Materialize Earthfalls: a comet whose mass sits at the ceiling strikes home.
 * Folds the log incrementally so each impact lands at the moment of the
 * answer that crossed the ceiling — idempotent, because the impact event
 * itself clears the flag.
 */
export function impactEvents(events: readonly GameEvent[], arkSouls: number): GameEvent[] {
  let state = initialState();
  const crossedAt = new Map<HabitId, number>();
  for (const event of [...events].sort((a, b) => a.ts - b.ts)) {
    state = reduceEvent(state, event);
    for (const comet of Object.values(state.comets)) {
      if (comet.alive && comet.impactReady && !crossedAt.has(comet.habit)) {
        crossedAt.set(comet.habit, event.ts);
      } else if (!(comet.alive && comet.impactReady)) {
        crossedAt.delete(comet.habit);
      }
    }
  }
  const out: GameEvent[] = [];
  for (const [habit, ts] of crossedAt) {
    out.push({ type: 'comet_struck_home', ts, habit, ark: arkSouls });
  }
  return out;
}

/** Dispersed comets whose next fragment is still inbound, for the countdown. */
export function inboundFragments(
  events: readonly GameEvent[],
  nowTs: number,
): { habit: HabitId; at: number }[] {
  const out: { habit: HabitId; at: number }[] = [];
  for (const [habit, dispersedTs] of openDispersals(events)) {
    const at = dispersedTs + RETURN_HOURS * HOUR;
    if (at > nowTs) out.push({ habit, at });
  }
  return out.sort((a, b) => a.at - b.at);
}

// Consecutive days, counting back from today, on which any observation was
// logged — clean or not. This is the behaviour the app actually depends on.
export function loggingStreak(events: readonly GameEvent[], nowTs: number): number {
  const days = new Set<string>();
  for (const event of events) {
    if (event.type === 'checkin_answered') {
      days.add(new Date(event.ts).toDateString());
    }
  }
  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const day = new Date(nowTs - i * 24 * HOUR).toDateString();
    if (!days.has(day)) {
      // today not being logged yet must not break yesterday's streak
      if (i === 0) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}
