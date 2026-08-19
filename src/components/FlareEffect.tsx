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

// Stellar flare overlay: a white core flash, a shock ring expanding out of it,
// short radial spikes, and particles thrown clear. Fires once on mount —
// remount (key change) to replay. Pure effect layer, nothing figurative.
const PARTICLES = Array.from({ length: 7 }, (_, i) => ({
  angle: (i / 7) * Math.PI * 2 + 0.5,
  reach: 0.42 + (i % 3) * 0.13,
}));

const SPIKES = Array.from({ length: 8 }, (_, i) => ({
  deg: (i / 8) * 360,
  length: 0.9 + (i % 2) * 0.4,
  delay: (i % 3) * 0.03,
}));

export function FlareEffect({ size = 260 }: { size?: number }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [p]);

  const flash = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.12, 0.35], [0.85, 0.45, 0]),
    transform: [{ scale: interpolate(p.value, [0, 0.35], [0.4, 1.5]) }],
  }));

  const ring = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.06, 0.5, 0.82], [0, 0.95, 0.4, 0]),
    transform: [{ scale: interpolate(p.value, [0, 0.82], [0.16, 1.2]) }],
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
        <Animated.View
          style={[
            styles.ring,
            {
              width: size * 0.88,
              height: size * 0.88,
              borderRadius: size * 0.44,
            },
            ring,
          ]}
        />
        {SPIKES.map((spike, i) => (
          <Spike key={i} p={p} size={size} deg={spike.deg} length={spike.length} delay={spike.delay} />
        ))}
        {PARTICLES.map((particle, i) => (
          <Steam key={i} p={p} size={size} angle={particle.angle} reach={particle.reach} />
        ))}
      </View>
    </View>
  );
}

function Spike({
  p,
  size,
  deg,
  length,
  delay,
}: {
  p: SharedValue<number>;
  size: number;
  deg: number;
  length: number;
  delay: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [delay, delay + 0.05, 0.3, 0.52], [0, 1, 0.6, 0]),
    transform: [
      { rotate: `${deg}deg` },
      // rotate first: translateX then rides the spike's own axis outward
      { translateX: interpolate(p.value, [delay, 0.52], [size * 0.07, size * 0.36]) },
      { scaleX: interpolate(p.value, [delay, 0.52], [0.3, 1]) },
    ],
  }));
  return <Animated.View style={[styles.spike, { width: size * 0.15 * length }, style]} />;
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
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: palette.ice,
  },
  spike: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#DCEAF2',
  },
  steam: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#C7D8E4',
  },
});
