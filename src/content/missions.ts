// Three machines whose entire identity is doing one job for decades past
// their warranty. A better model for keeping a practice than any hero.
export interface MissionTask {
  name: string;
  frequencyHours: number;
}

export interface Mission {
  id: 'opportunity' | 'hubble' | 'voyager';
  name: string;
  virtue: string;
  /** the real record that earns it the right to ask */
  record: string;
  line: string;
  tasks: MissionTask[];
}

export const MISSIONS: Mission[] = [
  {
    id: 'opportunity',
    name: 'OPPORTUNITY',
    virtue: 'ENDURANCE & UPKEEP',
    record: 'Warranty: 90 sols. Ran for 5,111.',
    line: 'Keep moving and keep clean. I did it for fourteen years on a ninety-day budget.',
    tasks: [
      { name: 'Pushups', frequencyHours: 24 },
      { name: 'Squats & sit-ups', frequencyHours: 24 },
      { name: 'Clean your room', frequencyHours: 48 },
      { name: 'Martial arts practice', frequencyHours: 168 },
    ],
  },
  {
    id: 'hubble',
    name: 'HUBBLE',
    virtue: 'CLARITY & CURIOSITY',
    record: 'Launched blurred. Corrected in orbit. Still observing.',
    line: 'Look at something properly today. The flaw was fixable; not looking was not.',
    tasks: [
      { name: 'Language practice', frequencyHours: 24 },
      { name: 'Read 20 pages', frequencyHours: 24 },
      { name: 'Build something', frequencyHours: 168 },
    ],
  },
  {
    id: 'voyager',
    name: 'VOYAGER 1',
    virtue: 'DISTANCE & RESOLVE',
    record: 'Interstellar space since 2012. Still returns a signal.',
    line: 'Decide where you are going. I have been going there since 1977.',
    tasks: [
      { name: 'Yoga / meditation', frequencyHours: 24 },
      { name: 'Reach out to an old friend', frequencyHours: 168 },
      { name: 'Review your long-term goals', frequencyHours: 168 },
    ],
  },
];
