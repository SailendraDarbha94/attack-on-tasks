// The three captains and the quest Titans they grant, from the flow sketch:
// Levi (strength & cleanliness), Hange (knowledge & curiosity),
// Erwin (willpower & leadership). Quests summon ordinary lesser Titans —
// the captains just know which work is worth doing.
export interface CaptainQuest {
  name: string;
  frequencyHours: number;
}

export interface Captain {
  id: 'levi' | 'hange' | 'erwin';
  name: string;
  virtue: string;
  line: string;
  quests: CaptainQuest[];
}

export const CAPTAINS: Captain[] = [
  {
    id: 'levi',
    name: 'CAPTAIN LEVI',
    virtue: 'STRENGTH & CLEANLINESS',
    line: "If you're going to fight, fight like you mean it. And clean up after yourself.",
    quests: [
      { name: 'Pushups', frequencyHours: 24 },
      { name: 'Squats & sit-ups', frequencyHours: 24 },
      { name: 'Clean your room', frequencyHours: 48 },
      { name: 'Martial arts practice', frequencyHours: 168 },
    ],
  },
  {
    id: 'hange',
    name: 'SECTION COMMANDER HANGE',
    virtue: 'KNOWLEDGE & CURIOSITY',
    line: 'A new specimen! Learn something today and tell me EVERYTHING.',
    quests: [
      { name: 'Language practice', frequencyHours: 24 },
      { name: 'Read 20 pages', frequencyHours: 24 },
      { name: 'Build something (print, code, craft)', frequencyHours: 168 },
    ],
  },
  {
    id: 'erwin',
    name: 'COMMANDER ERWIN',
    virtue: 'WILLPOWER & LEADERSHIP',
    line: 'A Scout who cannot command themselves will never command anyone.',
    quests: [
      { name: 'Yoga / meditation', frequencyHours: 24 },
      { name: 'Reach out to an old friend', frequencyHours: 168 },
      { name: 'Review your long-term goals', frequencyHours: 168 },
    ],
  },
];
