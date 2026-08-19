// The mapping that founds the game: how often a practice comes back around
// decides which world carries it. Faster orbit, more often.
//
// A world is DERIVED from a task's period and never stored, so changing a
// task's cadence moves it to another world while keeping all of its history.

export type BodyId =
  | 'mercury'
  | 'venus'
  | 'moon'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export interface Body {
  id: BodyId;
  name: string;
  /** canonical period for this world, in hours */
  hours: number;
  /** human label for the cadence, used in copy and the picker */
  cadence: string;
  /** real orbital period in Earth years — flavour, and the reason for the order */
  orbitYears: number;
  /** the one true feature the glyph draws */
  feature: string;
  color: string;
  /** ordinal glyph size in points; not to scale, clamped for legibility */
  glyphPt: number;
}

// Ordered by period. The Moon carries the dailies — its phases were
// humanity's first daily calendar — and Earth is not on the table at all:
// Earth is home. Inward of Mars the mapping is near-numeric; beyond that it
// is honestly ordinal — outward simply means less often.
export const BODIES: readonly Body[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    hours: 8,
    cadence: 'three times a day',
    orbitYears: 0.241,
    feature: 'cratered',
    color: '#9A948C',
    glyphPt: 20,
  },
  {
    id: 'venus',
    name: 'Venus',
    hours: 12,
    cadence: 'twice a day',
    orbitYears: 0.615,
    feature: 'featureless cloud',
    color: '#D9BE7E',
    glyphPt: 27,
  },
  {
    id: 'moon',
    name: 'Moon',
    hours: 24,
    cadence: 'every day',
    orbitYears: 0.0748,
    feature: 'maria and one rayed crater',
    color: '#C9CBD1',
    glyphPt: 22,
  },
  {
    id: 'mars',
    name: 'Mars',
    hours: 48,
    cadence: 'every 2 days',
    orbitYears: 1.881,
    feature: 'polar cap',
    color: '#C05B3A',
    glyphPt: 24,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    hours: 72,
    cadence: 'every 3 days',
    orbitYears: 11.86,
    feature: 'three bands, one red oval',
    color: '#C9A47B',
    glyphPt: 56,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    hours: 168,
    cadence: 'every week',
    orbitYears: 29.46,
    feature: 'ring with a division',
    color: '#D8C48F',
    glyphPt: 50,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    hours: 336,
    cadence: 'every 2 weeks',
    orbitYears: 84.01,
    feature: 'near-vertical rings',
    color: '#86C6C9',
    glyphPt: 38,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    hours: 720,
    cadence: 'monthly',
    orbitYears: 164.8,
    feature: 'one bright streak',
    color: '#3F63C4',
    glyphPt: 36,
  },
] as const;

// Home. Not a cadence body — population and the ledger live here, and the
// planet never leaves the plane.
export const EARTH: Body = {
  id: 'earth',
  name: 'Earth',
  hours: 24,
  cadence: 'home',
  orbitYears: 1,
  feature: 'clouds over seas',
  color: '#4E86C7',
  glyphPt: 30,
};

export const BODY_BY_ID: Record<BodyId, Body> = Object.fromEntries(
  [...BODIES, EARTH].map((b) => [b.id, b]),
) as Record<BodyId, Body>;

// Boundaries sit at the geometric mean of neighbouring periods, so every
// possible hour value lands on exactly one world and nothing falls through.
const BOUNDARIES: readonly number[] = BODIES.slice(0, -1).map((b, i) =>
  Math.sqrt(b.hours * BODIES[i + 1].hours),
);

/** Total function: every hour value resolves to exactly one world. */
export function bodyForHours(hours: number): Body {
  // NaN has no meaningful place on the plane; an unreadable period is a day.
  // Infinity falls through to the outermost world, which is the honest answer.
  if (Number.isNaN(hours)) return BODY_BY_ID.moon;
  for (let i = 0; i < BOUNDARIES.length; i++) {
    if (hours < BOUNDARIES[i]) return BODIES[i];
  }
  return BODIES[BODIES.length - 1];
}
