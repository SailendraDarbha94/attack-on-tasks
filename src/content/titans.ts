import type { HabitId } from '@/engine/types';

export interface TitanDef {
  habit: HabitId;
  name: string;
  epithet: string;
  question: string;
  taunt: string;
  onYes: string;
  onNo: string;
}

export const TITANS: Record<HabitId, TitanDef> = {
  smoke: {
    habit: 'smoke',
    name: 'The Smoking Titan',
    epithet: 'It smokes, casually, and watches you between drags.',
    question: 'Have you smoked in the last few hours?',
    taunt:
      "You're no weak piece of Garrison meat — that's ODM gear you're wearing. " +
      'You could kill me. But will you risk it?',
    onYes: 'It grows taller, exhales slowly, and strolls back into the trees.',
    onNo: 'Your blades bite. Steam erupts from the wound and it staggers.',
  },
  drink: {
    habit: 'drink',
    name: 'The Drinking Titan',
    epithet:
      'It sips from a gargantuan bottle of blood. It looks unsettlingly like Commander Pixis.',
    question: 'Did you partake alcohol in the last few hours?',
    taunt: 'Care for a drop, little Scout?',
    onYes: "Cheers mate! Soon I'll have some Scout Regiment blood in me bottle.",
    onNo: 'The bottle shatters in its fist. It shrinks, scowling at the waste.',
  },
};
