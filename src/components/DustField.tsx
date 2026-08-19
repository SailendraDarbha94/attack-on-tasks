import { useEffect } from 'react';
import { BlurMask, Canvas, Circle, Group } from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

// Interplanetary dust drifting outward through the plane — true blurred glow
// via Skia, driven by one shared clock on the UI thread. Deterministic params
// so every launch shows the same sky.
interface EmberParams {
  x0: number;
  y0: number;
  dir: number;
  speed: number;
  amp: number;
  phase: number;
  size: number;
  hue: string;
}

const EMBERS: EmberParams[] = Array.from({ length: 14 }, (_, i) => {
  const x0 = ((i * 0.071 + (i % 3) * 0.23) % 1) * 0.94 + 0.03;
  return {
    x0,
    y0: (i * 0.137) % 1,
    // each mote leaves by the edge it started nearest, so the field reads as
    // dust dispersing from the star, not one wind blowing across
    dir: x0 < 0.5 ? -1 : 1,
    speed: 0.55 + ((i * 13) % 7) / 14,
    amp: 0.02 + ((i * 7) % 5) / 160,
    phase: i * 1.7,
    size: 1.6 + ((i * 11) % 6) * 0.38,
    hue: i % 7 === 3 ? '#E8ECF7' : i % 3 === 0 ? '#D9A441' : '#8FC7D6',
  };
});

const CYCLE = 1.12; // particles wrap a little past either edge of the frame

function Ember({
  t,
  w,
  h,
  p,
}: {
  t: SharedValue<number>;
  w: number;
  h: number;
  p: EmberParams;
}) {
  const cx = useDerivedValue(() => {
    const xx = (((p.x0 + p.dir * t.value * p.speed) % CYCLE) + CYCLE) % CYCLE;
    return (xx - 0.06) * w;
  });
  const cy = useDerivedValue(
    () => (p.y0 + p.amp * Math.sin(t.value * Math.PI * 6 + p.phase)) * h,
  );
  const opacity = useDerivedValue(() => {
    const xx = (((p.x0 + p.dir * t.value * p.speed) % CYCLE) + CYCLE) % CYCLE;
    const fadeEdge = Math.min(1, xx / 0.22, (CYCLE - xx) / 0.22);
    const pulse = 0.5 + 0.5 * Math.sin(t.value * Math.PI * 17 + p.phase * 2);
    return (0.15 + 0.55 * pulse) * fadeEdge;
  });
  return <Circle cx={cx} cy={cy} r={p.size} color={p.hue} opacity={opacity} />;
}

export function DustField({ width, height }: { width: number; height: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 60_000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);

  if (!width || !height) return null;
  return (
    <Canvas
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
    >
      <Group>
        <BlurMask blur={3} style="solid" />
        {EMBERS.map((p, i) => (
          <Ember key={i} t={t} w={width} h={height} p={p} />
        ))}
      </Group>
    </Canvas>
  );
}
