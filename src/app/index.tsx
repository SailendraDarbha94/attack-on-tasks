import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TitanFigure } from '@/components/TitanFigure';
import { palette, spacing } from '@/constants/theme';
import { TITANS } from '@/content/titans';
import { nextSlot } from '@/engine/schedule';
import { MAX_SIZE } from '@/engine/titanMath';
import type { TitanState } from '@/engine/types';
import { useGame } from '@/state/game';

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ForestScreen() {
  const { game, pending, settings, hydrated } = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const upcoming = nextSlot(now, settings);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topRow}>
        <Text style={styles.overline}>FOREST OF THE GIANT TREES</Text>
        <Link href="/settings" asChild>
          <Pressable hitSlop={12}>
            <Text style={styles.gear}>GEAR</Text>
          </Pressable>
        </Link>
      </View>
      <Text style={styles.title}>
        {pending.length > 0
          ? 'Shapes are waiting between the trunks.'
          : 'The forest is quiet, for now.'}
      </Text>

      {pending.length > 0 && (
        <Link href="/encounter" asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>
              {pending.length === 1 ? 'A TITAN AWAITS' : `${pending.length} TITANS AWAIT`} — FACE
              THEM
            </Text>
          </Pressable>
        </Link>
      )}

      <View style={styles.cards}>
        {Object.values(game.titans).map((titan) => (
          <TitanCard key={titan.habit} titan={titan} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerStats}>
          ATTACK POWER {game.attackPower} · XP {game.xp}
        </Text>
        <Text style={styles.footerHint}>
          {!hydrated
            ? 'Checking the gear…'
            : upcoming
              ? `Next titans emerge in ${formatCountdown(upcoming - now)}`
              : 'No encounters scheduled.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

function TitanCard({ titan }: { titan: TitanState }) {
  const def = TITANS[titan.habit];
  const breathe = useSharedValue(1);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1.05, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [breathe]);

  const breathing = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const sizePct = Math.round((titan.size / MAX_SIZE) * 100);

  return (
    <View style={[styles.card, !titan.alive && styles.cardSlain]}>
      <Animated.View style={titan.alive ? breathing : undefined}>
        <TitanFigure habit={titan.habit} pose={titan.alive ? 'idle' : 'dying'} height={96} />
      </Animated.View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{def.name}</Text>
        {titan.alive ? (
          <>
            <Text style={styles.epithet}>{def.epithet}</Text>
            <View style={styles.sizeTrack}>
              <View style={[styles.sizeFill, { width: `${sizePct}%` as `${number}%` }]} />
            </View>
            <Text style={styles.sizeLabel}>
              SIZE {titan.size} / {MAX_SIZE}
              {titan.finisherReady ? '  ·  FINISHER READY' : ''}
            </Text>
          </>
        ) : (
          <Text style={styles.slain}>SLAIN. The forest remembers.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  overline: {
    color: palette.textDim,
    fontSize: 12,
    letterSpacing: 3,
  },
  gear: {
    color: palette.steel,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: palette.steel,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    color: palette.bg,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cards: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardSlain: {
    opacity: 0.45,
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  epithet: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 18,
  },
  sizeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.raised,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  sizeFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.blood,
  },
  sizeLabel: {
    color: palette.textDim,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  slain: {
    color: palette.steel,
    fontSize: 13,
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  footerStats: {
    color: palette.steel,
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '600',
  },
  footerHint: {
    color: palette.textDim,
    fontSize: 12,
  },
});
