import { variantIndex } from '@/engine/schedule';

// Lock-screen copy: always in-world, never names the habits — the question
// itself stays inside the app.
export interface NotificationLine {
  title: string;
  body: string;
}

export const NOTIFICATION_LINES: NotificationLine[] = [
  {
    title: 'Observation window open',
    body: 'Both comets are above the horizon. Log what you see.',
  },
  {
    title: 'The sky is clear',
    body: 'No excuses from the weather tonight.',
  },
  {
    title: 'Two objects on the plate',
    body: 'They have been tracked this long. Keep the record.',
  },
  {
    title: 'Your star is burning',
    body: 'Every hour it burns, something out there gets smaller.',
  },
  {
    title: 'Scheduled measurement',
    body: 'It takes ten seconds and it is the whole instrument.',
  },
  {
    title: 'Ashfall is in frame',
    body: 'Warm dust, curved tail. Note it honestly.',
  },
  {
    title: 'Stillwater crosses tonight',
    body: 'Straight ion tail, pointing away from the light.',
  },
  {
    title: 'The log has a gap in it',
    body: 'Gaps are just missing data. Data is easy to add.',
  },
  {
    title: 'Perihelion approaches',
    body: 'Nothing comes apart without a long run of small measurements first.',
  },
  {
    title: 'Keeper, the plane is turning',
    body: 'Worlds are coming due. So is the question.',
  },
  {
    title: 'Ephemeris check',
    body: 'Where things actually are, versus where you assumed.',
  },
  {
    title: 'Clear night, no moon',
    body: 'The best conditions you are going to get.',
  },
  {
    title: 'One measurement, either result',
    body: 'A flare recorded is worth exactly as much as a fade.',
  },
  {
    title: 'The instrument is warm',
    body: 'It only works if someone is at the eyepiece.',
  },
];

export function lineForSlot(slotTs: number): NotificationLine {
  return NOTIFICATION_LINES[variantIndex(slotTs, NOTIFICATION_LINES.length)];
}
