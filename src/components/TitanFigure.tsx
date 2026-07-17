import { Image } from 'expo-image';

import type { HabitId } from '@/engine/types';

export type TitanPose = 'idle' | 'grown' | 'flinch' | 'dying' | 'walk';
export type TitanKind = HabitId | 'chore';

// Art contract: 2:3 transparent PNGs, one file per titan kind per pose.
// 'walk' is the roaming side profile; kinds without one fall back to idle.
const ART: Record<TitanKind, Record<TitanPose, number>> = {
  smoke: {
    idle: require('../../assets/titans/smoke-idle.png'),
    grown: require('../../assets/titans/smoke-grown.png'),
    flinch: require('../../assets/titans/smoke-flinch.png'),
    dying: require('../../assets/titans/smoke-dying.png'),
    walk: require('../../assets/titans/smoke-walk.png'),
  },
  drink: {
    idle: require('../../assets/titans/drink-idle.png'),
    grown: require('../../assets/titans/drink-grown.png'),
    flinch: require('../../assets/titans/drink-flinch.png'),
    dying: require('../../assets/titans/drink-dying.png'),
    walk: require('../../assets/titans/drink-idle.png'),
  },
  chore: {
    idle: require('../../assets/titans/chore-idle.png'),
    grown: require('../../assets/titans/chore-grown.png'),
    flinch: require('../../assets/titans/chore-flinch.png'),
    dying: require('../../assets/titans/chore-dying.png'),
    walk: require('../../assets/titans/chore-idle.png'),
  },
};

export function TitanFigure({
  habit,
  pose = 'idle',
  height = 180,
}: {
  habit: TitanKind;
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
