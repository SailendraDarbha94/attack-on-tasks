import type { Asteroid, GameEvent } from './types';

// An asteroid is inbound from the moment it is tracked. Deflect it before
// its time and home is safe; let the deadline pass and it strikes. Either
// way it resolves exactly once — the record keeps the crater, not the guilt.

export type AsteroidOutcome = 'deflected' | 'struck';

export interface AsteroidState {
  asteroid: Asteroid;
  outcome: AsteroidOutcome | null;
  inbound: boolean;
  /** 0 at tracking, 1 at impact — how far along the approach it is */
  progress: number;
  msToImpact: number;
}

function outcomes(events: readonly GameEvent[]): Map<number, AsteroidOutcome> {
  const map = new Map<number, AsteroidOutcome>();
  for (const event of events) {
    if (event.type === 'asteroid_deflected') map.set(event.asteroidId, 'deflected');
    else if (event.type === 'asteroid_struck') map.set(event.asteroidId, 'struck');
  }
  return map;
}

export function asteroids(
  list: readonly Asteroid[],
  events: readonly GameEvent[],
  nowTs: number,
): AsteroidState[] {
  const resolved = outcomes(events);
  return list
    .map((asteroid) => {
      const outcome = resolved.get(asteroid.id) ?? null;
      const span = Math.max(asteroid.dueTs - asteroid.createdTs, 1);
      return {
        asteroid,
        outcome,
        inbound: outcome === null,
        progress: Math.min(Math.max((nowTs - asteroid.createdTs) / span, 0), 1),
        msToImpact: asteroid.dueTs - nowTs,
      };
    })
    .sort((a, b) =>
      a.inbound !== b.inbound ? (a.inbound ? -1 : 1) : a.asteroid.dueTs - b.asteroid.dueTs,
    );
}

// Materialize strikes for deadlines that passed unresolved — same clock
// pattern as expiries and comet returns: the strike lands at dueTs whether
// or not the app was open to see it.
export function strikeEvents(
  list: readonly Asteroid[],
  events: readonly GameEvent[],
  nowTs: number,
): GameEvent[] {
  const resolved = outcomes(events);
  const out: GameEvent[] = [];
  for (const asteroid of list) {
    if (!resolved.has(asteroid.id) && nowTs >= asteroid.dueTs) {
      out.push({ type: 'asteroid_struck', ts: asteroid.dueTs, asteroidId: asteroid.id });
    }
  }
  return out;
}
