import { variantIndex } from '@/engine/schedule';

// Lock-screen copy: always in-universe, never names the habits —
// the question itself stays inside the app.
export interface NotificationLine {
  title: string;
  body: string;
}

export const NOTIFICATION_LINES: NotificationLine[] = [
  {
    title: 'Titans emerge from the treeline',
    body: 'They are waiting between the trunks. Face them.',
  },
  {
    title: 'The ground trembles',
    body: 'Something big is moving beyond the mist.',
  },
  {
    title: 'Two shadows in the clearing',
    body: 'They already know you are here, Scout.',
  },
  {
    title: 'The forest has gone quiet',
    body: 'Birds scattered from the canopy. You know what that means.',
  },
  {
    title: 'Gas at full. Blades sharp.',
    body: 'The gear is ready, even if you are not.',
  },
  {
    title: 'A grin between the trees',
    body: 'It smiles because it thinks you will blink first.',
  },
  {
    title: 'You hear a bottle slosh',
    body: 'Cheers, mate — or not. Your call, Scout.',
  },
  {
    title: 'Smoke rises past the branches',
    body: 'Someone is exhaling in the mist. Make it regret that.',
  },
  {
    title: 'The watch continues',
    body: 'Every few hours, the same question. That is how walls get built.',
  },
  {
    title: 'Survey Corps report due',
    body: 'A Scout who reports honestly outlives one who does not.',
  },
  {
    title: 'Dusk in the Forest of Giant Trees',
    body: 'Lanterns lit. Eyes glowing back.',
  },
  {
    title: 'Your horse is still missing',
    body: 'Your blades are not. To the clearing.',
  },
  {
    title: 'Wings of Freedom',
    body: 'One honest answer at a time, Scout.',
  },
  {
    title: 'The nape is exposed',
    body: 'Strike while it lingers.',
  },
];

export function lineForSlot(slotTs: number): NotificationLine {
  return NOTIFICATION_LINES[variantIndex(slotTs, NOTIFICATION_LINES.length)];
}
