import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Screen shake: the camera itself takes the hit. Attach `style` to the
// container you want rattled, call `trigger(intensity)` on impact.
export function useShake() {
  const s = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: s.value }, { rotate: `${s.value * 0.06}deg` }],
  }));

  const trigger = useCallback(
    (intensity = 7) => {
      s.value = withSequence(
        withTiming(-intensity, { duration: 40 }),
        withRepeat(withTiming(intensity, { duration: 62 }), 4, true),
        withSpring(0, { damping: 14, stiffness: 220 }),
      );
    },
    [s],
  );

  return { style, trigger };
}
