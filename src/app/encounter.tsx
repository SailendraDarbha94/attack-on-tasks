import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playSfx } from '@/audio/sfx';
import { StrikeEffect } from '@/components/StrikeEffect';
import { TitanFigure } from '@/components/TitanFigure';
import { useShake } from '@/components/useShake';
import { palette, spacing } from '@/constants/theme';
import { TITANS } from '@/content/titans';
import { HOUR, nextSlot } from '@/engine/schedule';
import { MAX_SIZE } from '@/engine/titanMath';
import type { Answer, HabitId } from '@/engine/types';
import { useGame } from '@/state/game';

const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function EncounterScreen() {
  const { game, pending, settings, answer } = useGame();
  const [result, setResult] = useState<{ habit: HabitId; answer: Answer } | null>(null);
  const screenShake = useShake();

  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  const flash = useSharedValue(0);

  const figureStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: scale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const current = pending[0] ?? null;

  const onAnswer = async (ans: Answer) => {
    if (!current) return;
    await answer(current, ans);
    setResult({ habit: current.habit, answer: ans });
    if (ans === 'no') {
      playSfx('strike');
      screenShake.trigger(8);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 130);
      flash.value = withSequence(
        withTiming(0.85, { duration: 80 }),
        withTiming(0, { duration: 380 }),
      );
      shake.value = withSequence(
        withTiming(-9, { duration: 50 }),
        withRepeat(withTiming(9, { duration: 70 }), 5, true),
        withTiming(0, { duration: 60 }),
      );
      scale.value = withDelay(140, withSpring(0.8, { damping: 12 }));
    } else {
      playSfx('grow');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      scale.value = withTiming(1.18, { duration: 900, easing: Easing.out(Easing.quad) });
    }
  };

  const onContinue = () => {
    scale.value = 1;
    shake.value = 0;
    flash.value = 0;
    setResult(null);
  };

  // ── result phase ──────────────────────────────────────────────────────
  if (result) {
    const def = TITANS[result.habit];
    const titan = game.titans[result.habit];
    const struck = result.answer === 'no';
    const sizePct = Math.round((titan.size / MAX_SIZE) * 100);
    return (
      <SafeAreaView style={styles.screen}>
        <Animated.View style={[styles.shakeWrap, screenShake.style]}>
        <View style={styles.stage}>
          <Animated.View style={figureStyle}>
            <TitanFigure
              habit={result.habit}
              pose={result.answer === 'no' ? 'flinch' : 'grown'}
              height={230}
            />
          </Animated.View>
          {struck && <StrikeEffect size={280} />}
          <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
        </View>
        <Text style={[styles.verdict, { color: struck ? palette.steel : palette.blood }]}>
          {struck ? 'YOUR BLADES BITE' : 'IT GROWS'}
        </Text>
        <Text style={styles.line}>{struck ? def.onNo : def.onYes}</Text>
        {!struck && (
          <Text style={styles.reengage}>
            But you have gas in the tanks and blades left. Next emergence:{' '}
            {formatClock(nextSlot(Date.now(), settings) ?? Date.now())}.
          </Text>
        )}
        <View style={styles.sizeTrack}>
          <View style={[styles.sizeFill, { width: `${sizePct}%` as `${number}%` }]} />
        </View>
        <Text style={styles.sizeLabel}>
          SIZE {titan.size} / {MAX_SIZE}
          {titan.finisherReady ? '  ·  FINISHER READY' : ''}
        </Text>
        <Pressable style={styles.cta} onPress={onContinue}>
          <Text style={styles.ctaText}>
            {pending.length > 0 ? 'DRAW YOUR BLADES AGAIN' : 'LEAVE THE CLEARING'}
          </Text>
        </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── quiet forest ──────────────────────────────────────────────────────
  if (!current) {
    const upcoming = nextSlot(Date.now(), settings);
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.stage}>
          <Text style={styles.quiet}>The forest falls quiet.</Text>
        </View>
        <Text style={styles.line}>
          {upcoming
            ? `No titans near. The next emerge at ${formatClock(upcoming)}.`
            : 'No titans near.'}
        </Text>
        <Pressable style={styles.cta} onPress={() => router.back()}>
          <Text style={styles.ctaText}>RETURN</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── question phase ────────────────────────────────────────────────────
  const def = TITANS[current.habit];
  const lingering = Date.now() - current.slotTs > settings.cadenceHours * HOUR;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.stage}>
        <TitanFigure habit={current.habit} height={230} />
      </View>
      <Text style={styles.name}>{def.name}</Text>
      {lingering && (
        <Text style={styles.lingering}>It has lingered here since {formatClock(current.slotTs)}.</Text>
      )}
      <Text style={styles.taunt}>“{def.taunt}”</Text>
      <Text style={styles.question}>{def.question}</Text>
      <View style={styles.answers}>
        <Pressable style={[styles.answerBtn, styles.noBtn]} onPress={() => onAnswer('no')}>
          <Text style={styles.noText}>NO</Text>
        </Pressable>
        <Pressable style={[styles.answerBtn, styles.yesBtn]} onPress={() => onAnswer('yes')}>
          <Text style={styles.yesText}>YES</Text>
        </Pressable>
      </View>
      <Text style={styles.honesty}>Answer honestly. Honesty is XP — the game only ever plays against you.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  shakeWrap: {
    flex: 1,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.text,
  },
  name: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
  },
  lingering: {
    color: palette.amber,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  taunt: {
    color: palette.textDim,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  question: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  answers: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  answerBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  noBtn: {
    backgroundColor: palette.steel,
    borderColor: palette.steel,
  },
  noText: {
    color: palette.bg,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  yesBtn: {
    backgroundColor: 'transparent',
    borderColor: palette.border,
  },
  yesText: {
    color: palette.textDim,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  honesty: {
    color: palette.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  verdict: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  line: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  reengage: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  sizeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.raised,
    marginTop: spacing.md,
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
    marginTop: spacing.xs,
  },
  quiet: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '600',
  },
  cta: {
    marginTop: spacing.lg,
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
});
