// Captain Levi's landing-screen dialogue, keyed to how many honest strikes
// the Scout has landed. He warms up slowly. Very slowly.
export interface LeviGreeting {
  line: string;
  aside: string;
}

const TIERS: { min: number; greeting: LeviGreeting }[] = [
  {
    min: 25,
    greeting: {
      line: 'Not bad, Scout. Consider yourself squad material.',
      aside: 'Keep your blades clean. I hate mess.',
    },
  },
  {
    min: 10,
    greeting: {
      line: 'Impressive. Soon you can be a part of my squad.',
      aside: 'The Titans in this forest are starting to look nervous.',
    },
  },
  {
    min: 1,
    greeting: {
      line: "You've drawn blood. I'll give you that.",
      aside: 'A few honest strikes. Keep swinging, Scout.',
    },
  },
  {
    min: 0,
    greeting: {
      line: 'How would you like to be on my squad?',
      aside: "Then prove it. Are you killing enough Titans to be on my squad?",
    },
  },
];

export function leviGreeting(strikes: number): LeviGreeting {
  return TIERS.find((t) => strikes >= t.min)!.greeting;
}
