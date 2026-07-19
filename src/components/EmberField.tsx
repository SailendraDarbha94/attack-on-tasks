import { useEffect } from 'react';
import { BlurMask, Canvas, Circle, Group } from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

// Glowing motes drifting up through the clearing — true blurred glow via
// Skia, driven by one shared clock on the UI thread. Deterministic params
// so every launch shows the same forest.
interface EmberParams {
  x0: number;
  y0: number;
  speed: number;
  amp: number;
  phase: number;
  size: number;
  amber: boolean;
}

const EMBERS: EmberParams[] = Array.from({ length: 14 }, (_, i) => ({
  x0: ((i * 0.071 + (i % 3) * 0.23) % 1) * 0.94 + 0.03,
  y0: (i * 0.137) % 1,
  speed: 0.55 + ((i * 13) % 7) / 14,
  amp: 0.02 + ((i * 7) % 5) / 160,
  phase: i * 1.7,
  size: 1.6 + ((i * 11) % 6) * 0.38,
  amber: i % 3 !== 0,
}));

const CYCLE = 1.12; // particles wrap a little above/below the frame

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
  const cy = useDerivedValue(() => {
    const yy = (((p.y0 - t.value * p.speed) % CYCLE) + CYCLE) % CYCLE;
    return (yy - 0.06) * h;
  });
  const cx = useDerivedValue(
    () => (p.x0 + p.amp * Math.sin(t.value * Math.PI * 6 + p.phase)) * w,
  );
  const opacity = useDerivedValue(() => {
    const yy = (((p.y0 - t.value * p.speed) % CYCLE) + CYCLE) % CYCLE;
    const fadeTop = Math.min(1, yy / 0.22);
    const pulse = 0.5 + 0.5 * Math.sin(t.value * Math.PI * 17 + p.phase * 2);
    return (0.15 + 0.55 * pulse) * fadeTop;
  });
  return (
    <Circle cx={cx} cy={cy} r={p.size} color={p.amber ? '#E8B25C' : '#B7E3B4'} opacity={opacity} />
  );
}

export function EmberField({ width, height }: { width: number; height: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 60_000, easing: Easing.linear }), -1, false);
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
