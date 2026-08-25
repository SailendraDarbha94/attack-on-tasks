import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
} from '@shopify/react-native-skia';

import { playSfx } from '@/audio/sfx';
import { BodyGlyph } from '@/components/BodyGlyph';
import { CometGlyph } from '@/components/CometGlyph';
import { palette, spacing } from '@/constants/theme';
import { COMETS } from '@/content/comets';
import { KEEPERS } from '@/content/ark';
import { EARTH } from '@/engine/bodies';
import { MAX_MASS } from '@/engine/system';
import type { ArkKeeper, HabitId } from '@/engine/types';

const DIVE_MS = 1700;
const DRAIN_MS = 1900;

// The one ceremony nobody wants: a comet at full mass makes Earthfall. It
// plays once, says what happened, and hands the world to the keeper. The
// next window time follows, the same as after any other answer.
export function ImpactCeremony({
  habit,
  keeper,
  souls,
  from,
  onDone,
}: {
  habit: HabitId;
  keeper: ArkKeeper;
  souls: number;
  from: number;
  onDone: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [phase, setPhase] = useState<'dive' | 'fallen' | 'kept'>('dive');
  const [count, setCount] = useState(from);
  const dive = useSharedValue(0);
  const flash = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cometW = Math.min(280, width * 0.6);
  const earthX = width / 2;
  const earthY = height * 0.58;
  const fromX = width * 0.82;
  const fromY = height * 0.08;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    dive.value = withTiming(1, { duration: DIVE_MS, easing: Easing.in(Easing.quad) });

    timers.current.push(
      setTimeout(() => {
        setPhase('fallen');
        playSfx('surge');
        flash.value = withSequence(
          withTiming(1, { duration: 90 }),
          withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) }),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // the count drains from what stood to what the keeper holds
        const started = Date.now();
        const drain = setInterval(() => {
          const t = Math.min(1, (Date.now() - started) / DRAIN_MS);
          const eased = 1 - Math.pow(1 - t, 3);
          setCount(Math.round(from + (souls - from) * eased));
          if (t >= 1) clearInterval(drain);
        }, 50);
        timers.current.push(drain as unknown as ReturnType<typeof setTimeout>);
      }, DIVE_MS),
      setTimeout(() => setPhase('kept'), DIVE_MS + DRAIN_MS + 500),
    );

    return () => {
      timers.current.forEach(clearTimeout);
      cancelAnimation(dive);
      cancelAnimation(flash);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cometStyle = useAnimatedStyle(() => ({
    opacity: dive.value < 1 ? 1 : 0,
    transform: [
      { translateX: fromX - cometW / 2 + (earthX - fromX) * dive.value },
      { translateY: fromY + (earthY - fromY) * dive.value },
      { scale: 0.55 + 0.75 * dive.value },
      { rotate: '18deg' },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.root} pointerEvents="auto">
      <Animated.View pointerEvents="none" style={[styles.comet, { width: cometW, height: cometW }, cometStyle]}>
        <CometGlyph habit={habit} mass={MAX_MASS} width={cometW} height={cometW} />
      </Animated.View>

      {phase === 'dive' ? (
        <View pointerEvents="none" style={[styles.earth, { left: earthX - 27, top: earthY - 27 }]}>
          <BodyGlyph body={EARTH} size={54} />
        </View>
      ) : (
        <View
          pointerEvents="none"
          style={[styles.earth, { left: earthX - SHATTER_R, top: earthY - SHATTER_R }]}
        >
          <EarthShatter />
        </View>
      )}

      <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />

      {phase !== 'dive' && (
        <View style={styles.copy}>
          <Text style={styles.overline}>{COMETS[habit].designation}</Text>
          <Text style={styles.headline}>{COMETS[habit].name.toUpperCase()} MADE EARTHFALL</Text>
          <Text style={styles.population}>{count.toLocaleString()}</Text>
          <Text style={styles.aside}>The sky fell. The record holds.</Text>

          {phase === 'kept' && (
            <>
              <Text style={styles.keeperName}>{KEEPERS[keeper].name} ANSWERS</Text>
              <Text style={styles.keeperLine}>{KEEPERS[keeper].line(souls)}</Text>
              <Pressable style={styles.cta} onPress={onDone}>
                <Text style={styles.ctaText}>BEGIN AGAIN</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
      </View>
    </Modal>
  );
}

// ── the earth comes apart: shards, a shockwave, and embers ────────────────
const SHATTER_R = 130;
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const SHARDS = Array.from({ length: 9 }, (_, i) => ({
  angle: (i / 9) * Math.PI * 2 + (rand(i) - 0.5) * 0.5,
  speed: 0.55 + 0.45 * rand(i + 20),
  spin: (rand(i + 40) - 0.5) * 5,
  size: 9 + 8 * rand(i + 60),
}));
const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  angle: (i / 14) * Math.PI * 2 + (rand(i + 80) - 0.5) * 0.8,
  speed: 0.7 + 0.5 * rand(i + 100),
  size: 1.4 + 2.2 * rand(i + 120),
}));

function EarthShatter() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(p);
  }, [p]);

  const c = SHATTER_R;
  const waveR = useDerivedValue(() => 12 + p.value * (SHATTER_R - 6));
  const waveW = useDerivedValue(() => Math.max(0.5, 7 * (1 - p.value)));
  const waveA = useDerivedValue(() => 0.85 * (1 - p.value));
  const flashA = useDerivedValue(() => Math.max(0, 0.9 - p.value * 2.2));

  return (
    <Canvas pointerEvents="none" style={{ width: SHATTER_R * 2, height: SHATTER_R * 2 }}>
      {/* the light of the blow itself */}
      <Circle cx={c} cy={c} r={SHATTER_R * 0.5} color="#FFF3D6" opacity={flashA}>
        <BlurMask blur={22} style="normal" />
      </Circle>
      {/* shockwave */}
      <Circle cx={c} cy={c} r={waveR} style="stroke" strokeWidth={waveW} color={palette.flare} opacity={waveA}>
        <BlurMask blur={4} style="normal" />
      </Circle>
      {SHARDS.map((shard, i) => (
        <Shard key={i} p={p} c={c} {...shard} />
      ))}
      {EMBERS.map((ember, i) => (
        <Ember key={i} p={p} c={c} {...ember} />
      ))}
    </Canvas>
  );
}

function Shard({
  p,
  c,
  angle,
  speed,
  spin,
  size,
}: {
  p: ReturnType<typeof useSharedValue<number>>;
  c: number;
  angle: number;
  speed: number;
  spin: number;
  size: number;
}) {
  const path = useMemo(() => {
    const path2 = Skia.Path.Make();
    path2.moveTo(0, -size * 0.62);
    path2.lineTo(size * 0.55, size * 0.38);
    path2.lineTo(-size * 0.5, size * 0.44);
    path2.close();
    return path2;
  }, [size]);
  const transform = useDerivedValue(() => {
    const d = p.value * speed * (c - 14);
    return [
      { translateX: c + Math.cos(angle) * d },
      { translateY: c + Math.sin(angle) * d },
      { rotate: spin * p.value },
    ];
  });
  const opacity = useDerivedValue(() => Math.pow(1 - p.value, 1.35));

  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={path} color="#4E86C7" />
      <Path path={path} style="stroke" strokeWidth={1} color={palette.flare} opacity={0.7} />
    </Group>
  );
}

function Ember({
  p,
  c,
  angle,
  speed,
  size,
}: {
  p: ReturnType<typeof useSharedValue<number>>;
  c: number;
  angle: number;
  speed: number;
  size: number;
}) {
  const cx = useDerivedValue(() => c + Math.cos(angle) * Math.pow(p.value, 0.8) * speed * (c - 8));
  const cy = useDerivedValue(() => c + Math.sin(angle) * Math.pow(p.value, 0.8) * speed * (c - 8));
  const r = useDerivedValue(() => Math.max(0.2, size * (1 - p.value * 0.85)));
  const opacity = useDerivedValue(() => Math.max(0, 1 - p.value * 1.15));

  return <Circle cx={cx} cy={cy} r={r} color={palette.amber} opacity={opacity} />;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 4, 9, 0.96)',
    zIndex: 100,
  },
  comet: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  earth: {
    position: 'absolute',
  },
  flash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFF6E8',
  },
  copy: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '16%',
    alignItems: 'center',
  },
  overline: {
    color: palette.textDim,
    fontSize: 12,
    letterSpacing: 3,
  },
  headline: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  population: {
    color: palette.flare,
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: spacing.xl,
  },
  aside: {
    color: palette.textDim,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  keeperName: {
    color: palette.ice,
    fontSize: 13,
    letterSpacing: 3,
    marginTop: spacing.xl,
  },
  keeperLine: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cta: {
    marginTop: spacing.xl,
    borderColor: palette.ice,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  ctaText: {
    color: palette.ice,
    fontSize: 14,
    letterSpacing: 2,
  },
});
