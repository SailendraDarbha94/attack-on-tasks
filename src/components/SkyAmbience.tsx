import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import {
  BlurMask,
  Canvas,
  Fill,
  Group,
  LinearGradient,
  Path,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { palette } from '@/constants/theme';

// The sky the system hangs in. Everything here is decorative, runs on the UI
// thread, and must never intercept touches.

// Skia wants explicit alpha and the palette is opaque hex, so the gradient
// stops carry their own rgba.
const NEBULA_EDGE = 'rgba(143, 199, 214, 0)';
const NEBULA_COOL = 'rgba(143, 199, 214, 0.30)';
const NEBULA_CORE = 'rgba(118, 132, 208, 0.55)';
const RAY_NEAR = 'rgba(217, 164, 65, 0.34)';
const RAY_MID = 'rgba(143, 199, 214, 0.16)';
const RAY_FAR = 'rgba(143, 199, 214, 0)';

// Angular position on an ellipse: a world carried around by its own period,
// nothing bobbing in place. Phase is where on the ring it starts, so several
// bodies sharing a ring never bunch up, and the ellipse is a circle seen at
// an angle — hence the small scale term for the far half.
export function useOrbit({
  periodMs = 24_000,
  phase = 0,
  radiusX = 96,
  radiusY = 28,
  enabled = true,
}: {
  periodMs?: number;
  phase?: number;
  radiusX?: number;
  radiusY?: number;
  enabled?: boolean;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!enabled) {
      // a parked world must actually stop — the repeat loop does not die on
      // its own when the effect re-runs
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [enabled, periodMs, t]);

  return useAnimatedStyle(() => {
    const w = t.value * Math.PI * 2 + phase;
    const near = Math.sin(w); // +1 on the near side of the ring, -1 behind
    return {
      transform: [
        { translateX: radiusX * Math.cos(w) },
        { translateY: radiusY * near },
        { scale: 1 + 0.07 * near },
      ],
    };
  });
}

// A satellite on a foreshortened orbit should truly pass behind its primary.
// One clock, three styles: the orbit transform goes on two mounted copies of
// the satellite — the far one drawn under the primary, the near one over it —
// and visibility swaps at the crossings, where satellite and primary never
// overlap, so the handoff is invisible. Depth does the rest: the far copy
// runs smaller, slower-looking and dimmer, which is what "behind" looks like.
export function useOrbitOcclusion({
  periodMs = 24_000,
  phase = 0,
  radiusX = 96,
  radiusY = 28,
  depthScale = 0.16,
}: {
  periodMs?: number;
  phase?: number;
  radiusX?: number;
  radiusY?: number;
  depthScale?: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [periodMs, t]);

  const orbit = useAnimatedStyle(() => {
    const w = t.value * Math.PI * 2 + phase;
    const near = Math.sin(w); // +1 nearest the viewer, -1 directly behind
    return {
      transform: [
        { translateX: radiusX * Math.cos(w) },
        { translateY: radiusY * near },
        { scale: 1 + depthScale * near },
      ],
    };
  });

  const front = useAnimatedStyle(() => {
    const near = Math.sin(t.value * Math.PI * 2 + phase) >= 0;
    return { opacity: near ? 1 : 0, pointerEvents: near ? 'auto' : 'none' } as const;
  });

  const back = useAnimatedStyle(() => {
    const near = Math.sin(t.value * Math.PI * 2 + phase) >= 0;
    // the far side sits in the primary's light, a step dimmer
    return { opacity: near ? 0 : 0.82 };
  });

  return { orbit, front, back };
}

interface StarParams {
  left: DimensionValue;
  top: DimensionValue;
  size: number;
  /** whole cycles per clock turn, so the twinkle never jumps at the wrap */
  rate: number;
  phase: number;
  amp: number;
  warm: boolean;
}

// Scattered, not lattice: a cheap deterministic hash, so it is the same sky
// on every launch.
const hash = (n: number) => {
  const s = Math.sin(n) * 43758.5453;
  return s - Math.floor(s);
};

const place = (v: number, span: number): DimensionValue =>
  `${Math.round(v * span * 10) / 10}%`;

const STARS: StarParams[] = Array.from({ length: 44 }, (_, i) => ({
  left: place(hash(i * 12.9898), 97),
  top: place(hash(i * 78.233 + 4.1), 94),
  size: 1 + (i % 4) * 0.5,
  rate: 2 + (i % 5),
  phase: i * 1.13,
  amp: 0.14 + (i % 3) * 0.11,
  warm: i % 7 === 0,
}));

// Fixed background stars. One clock, staggered phases — 44 repeat loops
// would be 44 things to cancel.
export function Starfield() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 9_000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);

  return (
    <>
      {STARS.map((p, i) => (
        <Star key={i} t={t} p={p} />
      ))}
    </>
  );
}

function Star({ t, p }: { t: SharedValue<number>; p: StarParams }) {
  const style = useAnimatedStyle(() => {
    const w = t.value * Math.PI * 2;
    return { opacity: 0.18 + p.amp * (1 + Math.sin(w * p.rate + p.phase)) };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.star,
        {
          left: p.left,
          top: p.top,
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,
          backgroundColor: p.warm ? palette.amber : palette.text,
        },
        style,
      ]}
    />
  );
}

// A faint band of cold gas across the field, drifting sideways and slowly
// thickening. Gradient rather than a bar so it has no edges to give it away.
export function NebulaBand({
  top,
  height,
  opacity,
  duration,
}: {
  top: number;
  height: number;
  opacity: number;
  duration: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(t);
  }, [duration, t]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity * (0.65 + 0.35 * Math.sin(t.value * Math.PI)),
    transform: [{ translateX: interpolate(t.value, [0, 1], [-70, 70]) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.nebula, { top, height }, style]}>
      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Fill>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[NEBULA_EDGE, NEBULA_COOL, NEBULA_CORE, NEBULA_EDGE]}
            positions={[0, 0.34, 0.6, 1]}
          />
        </Fill>
      </Canvas>
    </Animated.View>
  );
}

// A ray of starlight reaching out of frame, brightening and dimming as the
// corona shifts. Drawn, not an image — a tapering wedge holding a gradient
// that runs out before it ends.
export function CoronaRay({
  left,
  angle,
  period,
  height = 430,
  width = 96,
  phase = 0,
}: {
  left: number;
  angle: number;
  period: number;
  height?: number;
  width?: number;
  phase?: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [period, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.18 + 0.34 * (0.5 + 0.5 * Math.sin(t.value * Math.PI * 2 + phase)),
    transform: [
      { rotate: `${angle}deg` },
      { translateX: 8 * Math.sin(t.value * Math.PI + phase) },
    ],
  }));

  const wedge = `M ${width * 0.36} 0 L ${width * 0.64} 0 L ${width} ${height} L 0 ${height} Z`;

  return (
    <Animated.View pointerEvents="none" style={[styles.ray, { left, width, height }, style]}>
      <Canvas pointerEvents="none" style={{ width, height }}>
        <Group>
          <BlurMask blur={9} style="normal" />
          <Path path={wedge}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={[RAY_NEAR, RAY_MID, RAY_FAR]}
              positions={[0, 0.45, 1]}
            />
          </Path>
        </Group>
      </Canvas>
    </Animated.View>
  );
}

const METEORS = [
  { left: '18%', delay: 2_400, period: 26_000, angle: 34, length: 96 },
  { left: '62%', delay: 11_000, period: 31_000, angle: 27, length: 74 },
  { left: '84%', delay: 19_000, period: 23_000, angle: 41, length: 112 },
  { left: '40%', delay: 6_800, period: 37_000, angle: 31, length: 84 },
] as const;

// The pass itself is a small slice of each cycle; the rest is empty sky,
// which is what makes a meteor worth looking up for.
const STREAK = 0.13;

export function Meteors({ drop = 430 }: { drop?: number }) {
  return (
    <View pointerEvents="none" style={styles.meteorField}>
      {METEORS.map((m, i) => (
        <Meteor key={i} {...m} drop={drop} />
      ))}
    </View>
  );
}

function Meteor({
  left,
  delay,
  period,
  angle,
  length,
  drop,
}: {
  left: DimensionValue;
  delay: number;
  period: number;
  angle: number;
  length: number;
  drop: number;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(t);
  }, [delay, period, t]);

  const rad = (angle * Math.PI) / 180;
  const reach = drop / Math.sin(rad);

  const style = useAnimatedStyle(() => {
    const p = Math.min(t.value / STREAK, 1);
    const travel = p * reach;
    return {
      opacity: interpolate(p, [0, 0.07, 0.6, 1], [0, 0.9, 0.5, 0]),
      transform: [
        { translateX: Math.cos(rad) * travel },
        { translateY: Math.sin(rad) * travel },
        { rotate: `${angle}deg` },
      ],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.meteor, { left, width: length }, style]}>
      <View style={styles.meteorTrail} />
      <View style={styles.meteorHead} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
  nebula: {
    position: 'absolute',
    left: -90,
    right: -90,
  },
  ray: {
    position: 'absolute',
    top: -30,
  },
  meteorField: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  meteor: {
    position: 'absolute',
    top: -28,
    height: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meteorTrail: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(232, 236, 247, 0.4)',
  },
  meteorHead: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.text,
    shadowColor: palette.ice,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
