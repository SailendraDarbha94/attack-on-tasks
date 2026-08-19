import type { HabitId } from '@/engine/types';

// Two sungrazers on steep crossing orbits. They have no period and no due
// date — they are simply always in the sky, which is the truth about a vice.
export interface CometDef {
  habit: HabitId;
  name: string;
  designation: string;
  /** what it is, in one line */
  epithet: string;
  /** the literal question, unchanged — this is the whole game */
  question: string;
  /** what it says while it is still out there */
  taunt: string;
  /** an outburst: recorded, never scolded */
  onYes: string;
  /** ablation: the star boiled volatiles off the nucleus */
  onNo: string;
}

export const COMETS: Record<HabitId, CometDef> = {
  smoke: {
    habit: 'smoke',
    name: 'Ashfall',
    designation: 'C/2019 A1',
    epithet: 'A dark nucleus trailing warm dust. It brightens every time you feed it.',
    question: 'Have you smoked in the last few hours?',
    taunt: 'Still here. Still bright. You have been watching me for a while now.',
    onYes: 'It flared — an outburst, recorded. The coma widens and the tail runs longer.',
    onNo: 'Your star boils volatiles off the nucleus. The coma thins; it comes back smaller.',
  },
  drink: {
    habit: 'drink',
    name: 'Stillwater',
    designation: 'C/2021 B2',
    epithet: 'A cold ion tail, straight as a ruler, pointing away from the star.',
    question: 'Did you partake alcohol in the last few hours?',
    taunt: 'No hurry. I cross this way every time you look up.',
    onYes: 'It flared — an outburst, recorded. Ice sublimates and the tail stretches.',
    onNo: 'Sunlight strips the ion tail. Less of it comes out the other side.',
  },
};
