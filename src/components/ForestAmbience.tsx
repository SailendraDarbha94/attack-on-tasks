import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/constants/theme';

// Ambient life for the clearing. Everything here is decorative, runs on the
// UI thread, and must never intercept touches.

// A creature's patrol, not a sprite's bob: the titan paces its stretch of
// clearing, strides while moving (gait bob + lean into the walk), turns
// around at each end (horizontal flip), and settles to breathing when it
// pauses at the turn. One linear clock drives everything.
export function useWander({
  range = 28,
  period = 10_000,
  bob = 4,
  tilt = 1.3,
  phase = 0,
  enabled = true,
}: {
  range?: number;
  period?: number;
  bob?: number;
  tilt?: number;
  phase?: number;
  enabled?: boolean;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!enabled) return;
    t.value = withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false);
  }, [enabled, period, t]);

  return useAnimatedStyle(() => {
    const w = t.value * Math.PI * 2;
    const stride = Math.cos(w); // velocity of the patrol
    const dir = stride >= 0 ? 1 : -1;
    const speed = Math.abs(stride);
    const step = Math.sin(w * 6 + phase); // footfalls
    const breathe = 1 + 0.02 * (0.5 + 0.5 * Math.sin(w * 2 + phase));
    return {
      transform: [
        { translateX: range * Math.sin(w) },
        { translateY: -Math.abs(step) * bob * (0.25 + 0.75 * speed) },
        { rotate: `${step * tilt * speed + dir * 0.9}deg` },
        { scaleX: dir },
        { scale: breathe },
      ],
    };
  });
}

// A band of ground mist drifting sideways, slowly thickening and thinning.
export function MistBand({
  bottom,
  height,
  opacity,
  duration,
}: {
  bottom: number;
  height: number;
  opacity: number;
  duration: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [duration, t]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity * (0.7 + 0.3 * Math.sin(t.value * Math.PI)),
    transform: [{ translateX: interpolate(t.value, [0, 1], [-64, 64]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.mist, { bottom, height, borderRadius: height / 2 }, style]}
    />
  );
}

const FLIES = [
  { left: '16%', top: '38%', period: 5200, phase: 0.4 },
  { left: '68%', top: '30%', period: 6400, phase: 2.1 },
  { left: '44%', top: '52%', period: 4700, phase: 4.4 },
  { left: '82%', top: '58%', period: 7300, phase: 1.2 },
  { left: '28%', top: '66%', period: 5900, phase: 3.3 },
  { left: '58%', top: '20%', period: 6800, phase: 5.1 },
] as const;

export function Fireflies() {
  return (
    <>
      {FLIES.map((fly, i) => (
        <Firefly key={i} {...fly} />
      ))}
    </>
  );
}

function Firefly({
  left,
  top,
  period,
  phase,
}: {
  left: string;
  top: string;
  period: number;
  phase: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false);
  }, [period, t]);

  const style = useAnimatedStyle(() => {
    const w = t.value * Math.PI * 2;
    return {
      opacity: 0.12 + 0.7 * (0.5 + 0.5 * Math.sin(w * 2.3 + phase)),
      transform: [
        { translateX: 16 * Math.sin(w + phase) },
        { translateY: 11 * Math.sin(w * 1.7 + phase * 2) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.firefly, { left, top } as object, style]}
    />
  );
}

// A shaft of canopy light, slowly brightening and dimming as leaves shift.
export function LightShaft({
  left,
  angle,
  period,
  height = 430,
  phase = 0,
}: {
  left: number;
  angle: number;
  period: number;
  height?: number;
  phase?: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [period, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.22 + 0.38 * (0.5 + 0.5 * Math.sin(t.value * Math.PI * 2 + phase)),
    transform: [
      { rotate: `${angle}deg` },
      { translateX: 8 * Math.sin(t.value * Math.PI + phase) },
    ],
  }));

  return (
    <Animated.Image
      source={require('../../assets/scenery/shaft.png')}
      style={[styles.shaft, { left, height }, style]}
    />
  );
}

// Leaves shaken loose from the canopy, drifting down through the clearing.
const LEAVES = [
  { left: '22%', period: 15_000, phase: 0.2, size: 9 },
  { left: '52%', period: 21_000, phase: 2.6, size: 7 },
  { left: '74%', period: 17_500, phase: 4.4, size: 10 },
  { left: '38%', period: 24_000, phase: 1.4, size: 8 },
] as const;

export function FallingLeaves({ drop = 430 }: { drop?: number }) {
  return (
    <>
      {LEAVES.map((leaf, i) => (
        <Leaf key={i} {...leaf} drop={drop} />
      ))}
    </>
  );
}

function Leaf({
  left,
  period,
  phase,
  size,
  drop,
}: {
  left: string;
  period: number;
  phase: number;
  size: number;
  drop: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false);
  }, [period, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.06, 0.75, 0.96], [0, 0.75, 0.6, 0]),
    transform: [
      { translateY: t.value * drop },
      { translateX: 26 * Math.sin(t.value * Math.PI * 3 + phase) },
      { rotate: `${t.value * 520 + phase * 60}deg` },
    ],
  }));

  return (
    <Animated.Image
      source={require('../../assets/scenery/leaf.png')}
      style={[
        styles.leaf,
        { left, width: size * 1.7, height: size, pointerEvents: 'none' } as object,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  mist: {
    position: 'absolute',
    left: -80,
    right: -80,
    backgroundColor: '#93A696',
  },
  firefly: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.amber,
    shadowColor: palette.amber,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  shaft: {
    position: 'absolute',
    top: -30,
    width: 90,
    pointerEvents: 'none',
  },
  leaf: {
    position: 'absolute',
    top: -12,
  },
});
