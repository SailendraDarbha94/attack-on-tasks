import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { palette } from '@/constants/theme';

// ODM blade strike overlay: two crossing slash streaks, a white impact
// flash, and steam particles bursting outward. Fires once on mount —
// remount (key change) to replay. Pure effect layer, no characters.
const PARTICLES = Array.from({ length: 7 }, (_, i) => ({
  angle: (i / 7) * Math.PI * 2 + 0.5,
  reach: 0.42 + (i % 3) * 0.13,
}));

export function StrikeEffect({ size = 260 }: { size?: number }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [p]);

  const flash = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.12, 0.35], [0.85, 0.45, 0]),
    transform: [{ scale: interpolate(p.value, [0, 0.35], [0.4, 1.5]) }],
  }));

  const slashA = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.04, 0.26, 0.34], [0, 1, 1, 0]),
    transform: [
      { rotate: '-36deg' },
      { translateX: interpolate(p.value, [0, 0.3], [-size * 0.9, size * 0.7]) },
    ],
  }));

  const slashB = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.1, 0.16, 0.4, 0.48], [0, 1, 1, 0]),
    transform: [
      { rotate: '28deg' },
      { translateX: interpolate(p.value, [0.1, 0.44], [size * 0.9, -size * 0.7]) },
    ],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.flash,
            { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 },
            flash,
          ]}
        />
        <Animated.View style={[styles.slash, { width: size * 1.1 }, slashA]} />
        <Animated.View style={[styles.slash, { width: size * 0.9, height: 4 }, slashB]} />
        {PARTICLES.map((particle, i) => (
          <Steam key={i} p={p} size={size} angle={particle.angle} reach={particle.reach} />
        ))}
      </View>
    </View>
  );
}

function Steam({
  p,
  size,
  angle,
  reach,
}: {
  p: SharedValue<number>;
  size: number;
  angle: number;
  reach: number;
}) {
  const style = useAnimatedStyle(() => {
    const travel = interpolate(p.value, [0.15, 1], [0, size * reach]);
    return {
      opacity: interpolate(p.value, [0.15, 0.3, 1], [0, 0.8, 0]),
      transform: [
        { translateX: Math.cos(angle) * travel },
        { translateY: Math.sin(angle) * travel * 0.8 - travel * 0.2 },
        { scale: interpolate(p.value, [0.15, 1], [1, 0.35]) },
      ],
    };
  });
  return <Animated.View style={[styles.steam, style]} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    position: 'absolute',
    backgroundColor: palette.text,
  },
  slash: {
    position: 'absolute',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F2FBF4',
  },
  steam: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C9D6CC',
  },
});
