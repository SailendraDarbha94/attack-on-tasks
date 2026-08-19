// The observatory's line to the keeper, tiered on consecutive days with ANY
// observation logged — clean or not. Rewarding the logging rather than the
// outcome is deliberate: the encouragement has to hold on a bad week, which
// is exactly when the old version went silent.
export interface ReportLine {
  line: string;
  aside: string;
}

const TIERS: { min: number; report: ReportLine }[] = [
  {
    min: 30,
    report: {
      line: 'A month of unbroken record. This is an observatory now.',
      aside: 'Nothing out there has changed. You did.',
    },
  },
  {
    min: 14,
    report: {
      line: 'Two weeks of continuous coverage.',
      aside: 'The ephemeris is holding. Keep the log.',
    },
  },
  {
    min: 5,
    report: {
      line: 'The record is unbroken.',
      aside: 'Consistent observation is the whole instrument.',
    },
  },
  {
    min: 1,
    report: {
      line: 'Log is current.',
      aside: 'An honest entry is worth the same whichever way it went.',
    },
  },
  {
    min: 0,
    report: {
      line: 'No observations logged yet today.',
      aside: 'The sky does not mind. Start whenever you look up.',
    },
  },
];

export function reportLine(streakDays: number): ReportLine {
  return TIERS.find((t) => streakDays >= t.min)!.report;
}
