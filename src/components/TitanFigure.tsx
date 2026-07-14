import { Image } from 'expo-image';

import type { HabitId } from '@/engine/types';

export type TitanPose = 'idle' | 'grown' | 'flinch' | 'dying';

// Art contract: 2:3 transparent PNGs, one file per boss per pose.
// Regenerate or replace the files without touching any screen code.
const ART: Record<HabitId, Record<TitanPose, number>> = {
  smoke: {
    idle: require('../../assets/titans/smoke-idle.png'),
    grown: require('../../assets/titans/smoke-grown.png'),
    flinch: require('../../assets/titans/smoke-flinch.png'),
    dying: require('../../assets/titans/smoke-dying.png'),
  },
  drink: {
    idle: require('../../assets/titans/drink-idle.png'),
    grown: require('../../assets/titans/drink-grown.png'),
    flinch: require('../../assets/titans/drink-flinch.png'),
    dying: require('../../assets/titans/drink-dying.png'),
  },
};

export function TitanFigure({
  habit,
  pose = 'idle',
  height = 180,
}: {
  habit: HabitId;
  pose?: TitanPose;
  height?: number;
}) {
  return (
    <Image
      source={ART[habit][pose]}
      style={{ height, width: (height * 2) / 3 }}
      contentFit="contain"
      transition={120}
    />
  );
}
