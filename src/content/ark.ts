import type { ArkKeeper } from '@/engine/types';

// Whoever keeps the ark, the deal is the same: the flood ends, the door
// opens, and a small number walks out to begin again. No verdicts on board.
export const KEEPERS: Record<ArkKeeper, { name: string; line: (souls: number) => string }> = {
  noah: {
    name: 'NOAH',
    line: (souls) =>
      `Noah lifts the hatch and counts ${souls.toLocaleString()} souls back into the light.`,
  },
  brahma: {
    name: 'BRAHMA',
    line: (souls) =>
      `Brahma exhales, and ${souls.toLocaleString()} souls wake on the new shore.`,
  },
  jesus: {
    name: 'JESUS',
    line: (souls) =>
      `Through the fire, ${souls.toLocaleString()} souls are kept — and walk out.`,
  },
};

export const KEEPER_IDS: ArkKeeper[] = ['noah', 'brahma', 'jesus'];
