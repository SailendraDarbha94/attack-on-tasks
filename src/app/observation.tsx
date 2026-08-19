import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  cancelAnimation,
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
import { CometGlyph } from '@/components/CometGlyph';
import { FlareEffect } from '@/components/FlareEffect';
import { useShake } from '@/components/useShake';
import { palette, spacing } from '@/constants/theme';
import { COMETS } from '@/content/comets';
import { HOUR, nextSlot } from '@/engine/schedule';
import { MAX_MASS } from '@/engine/system';
import type { Answer, HabitId } from '@/engine/types';
import { useGame } from '@/state/game';

const OUTBURST_VERDICT = 'IT FLARED — an outburst, recorded';

const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// onYes opens with the words the verdict already carries; drop that lead
// sentence rather than print it twice.
function outburstLine(line: string): string {
  const lead = `${OUTBURST_VERDICT}.`.toLowerCase();
  return line.toLowerCase().startsWith(lead) ? line.slice(lead.length).trimStart() : line;
}

function toPlane() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function ObservationScreen() {
  const { game, pending, settings, answer } = useGame();
  const [result, setResult] = useState<{ habit: HabitId; answer: Answer } | null>(null);
  const { width, height } = useWindowDimensions();
  const screenShake = useShake();

  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  const flash = useSharedValue(0);
  const sway = useSharedValue(0);

  const current = pending[0] ?? null;
  const waiting = current !== null && result === null;

  useEffect(() => {
    if (!waiting) {
      // the loop does not die on its own when the phase changes
      cancelAnimation(sway);
      sway.value = withTiming(0, { duration: 240 });
      return;
    }
    sway.value = withRepeat(
      withTiming(1, { duration: 5_200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(sway);
  }, [waiting, sway]);

  const cometStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value + sway.value * 5 },
      { translateY: sway.value * -3 },
      { scale: scale.value },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  // sized off the window rather than onLayout, so the first frame the canvas
  // draws is already the right one
  const stage = { width: width - spacing.lg * 2, height: Math.min(260, height * 0.32) };

  const onAnswer = async (ans: Answer) => {
    if (!current) return;
    await answer(current, ans);
    setResult({ habit: current.habit, answer: ans });
    if (ans === 'no') {
      playSfx('pulse');
      screenShake.trigger(8);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 130);
      flash.value = withSequence(
        withTiming(0.7, { duration: 80 }),
        withTiming(0, { duration: 380 }),
      );
      shake.value = withSequence(
        withTiming(-9, { duration: 50 }),
        withRepeat(withTiming(9, { duration: 70 }), 5, true),
        withTiming(0, { duration: 60 }),
      );
      scale.value = withDelay(140, withSpring(0.82, { damping: 12 }));
    } else {
      playSfx('surge');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      scale.value = withTiming(1.16, { duration: 900, easing: Easing.out(Easing.quad) });
    }
  };

  const onContinue = () => {
    scale.value = 1;
    shake.value = 0;
    flash.value = 0;
    setResult(null);
    if (pending.length === 0) toPlane();
  };

  // ── result phase ──────────────────────────────────────────────────────
  if (result) {
    const def = COMETS[result.habit];
    const comet = game.comets[result.habit];
    const faded = result.answer === 'no';
    const massPct = Math.round((comet.mass / MAX_MASS) * 100);
    const upcoming = nextSlot(Date.now(), settings);
    return (
      <SafeAreaView style={styles.screen}>
        <Animated.View style={[styles.shakeWrap, screenShake.style]}>
          <View style={styles.stage}>
            <Animated.View style={cometStyle}>
              <CometGlyph
                habit={result.habit}
                mass={comet.mass}
                width={stage.width}
                height={stage.height}
              />
            </Animated.View>
            {faded && <FlareEffect size={280} />}
            <Animated.View pointerEvents="none" style={[styles.flash, flashStyle]} />
          </View>
          <Text style={[styles.verdict, { color: faded ? palette.ice : palette.flare }]}>
            {faded ? 'IT FADED' : OUTBURST_VERDICT}
          </Text>
          <Text style={styles.line}>{faded ? def.onNo : outburstLine(def.onYes)}</Text>
          {!faded && (
            <Text style={styles.reengage}>
              {upcoming
                ? `Nothing is lost by saying so — the light is gathered either way. You get another look at ${formatClock(upcoming)}.`
                : 'Nothing is lost by saying so — the light is gathered either way.'}
            </Text>
          )}
          {comet.alive ? (
            <>
              <View style={styles.massTrack}>
                <View style={[styles.massFill, { width: `${massPct}%` as `${number}%` }]} />
              </View>
              <Text style={styles.massLabel}>
                MASS {comet.mass} / {MAX_MASS}
              </Text>
            </>
          ) : (
            <Text style={styles.reengage}>
              {def.name} is not in the sky right now — the next fragment is still inbound. The
              light counts all the same.
            </Text>
          )}
          {comet.finisherReady && (
            <Text style={styles.bare}>The nucleus is bare. Let it make perihelion.</Text>
          )}
          <Text style={styles.honesty}>
            An honest entry is worth the same whichever way it went.
          </Text>
          <Pressable style={styles.cta} onPress={onContinue}>
            <Text style={styles.ctaText}>
              {pending.length > 0 ? 'NEXT MEASUREMENT' : 'BACK TO THE PLANE'}
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── nothing pending ───────────────────────────────────────────────────
  if (!current) {
    const upcoming = nextSlot(Date.now(), settings);
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.stage}>
          <Text style={styles.quiet}>No windows open.</Text>
          <Text style={styles.quietLine}>
            {upcoming ? `The next one opens at ${formatClock(upcoming)}.` : 'Nothing scheduled.'}
          </Text>
        </View>
        <Pressable style={styles.cta} onPress={toPlane}>
          <Text style={styles.ctaText}>BACK TO THE PLANE</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── question phase ────────────────────────────────────────────────────
  const def = COMETS[current.habit];
  const comet = game.comets[current.habit];
  const held = Date.now() - current.slotTs > settings.cadenceHours * HOUR;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.stage}>
        <Animated.View style={cometStyle}>
          <CometGlyph
            habit={current.habit}
            mass={comet.mass}
            width={stage.width}
            height={stage.height}
          />
        </Animated.View>
      </View>
      <Text style={styles.designation}>{def.designation}</Text>
      <Text style={styles.name}>{def.name}</Text>
      {held && (
        <Text style={styles.held}>
          This window opened at {formatClock(current.slotTs)}, and is still open.
        </Text>
      )}
      <Text style={styles.taunt}>“{def.taunt}”</Text>
      {!comet.alive && (
        <Text style={styles.held}>
          Dispersed — the next fragment is inbound. The question stands.
        </Text>
      )}
      <Text style={styles.question}>{def.question}</Text>
      <View style={styles.answers}>
        <Pressable style={[styles.answerBtn, styles.fadedBtn]} onPress={() => onAnswer('no')}>
          <Text style={styles.fadedText}>IT FADED</Text>
        </Pressable>
        <Pressable style={[styles.answerBtn, styles.flaredBtn]} onPress={() => onAnswer('yes')}>
          <Text style={styles.flaredText}>IT FLARED</Text>
        </Pressable>
      </View>
      <Text style={styles.honesty}>An honest entry is worth the same whichever way it went.</Text>
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
  designation: {
    color: palette.textDim,
    fontSize: 11,
    letterSpacing: 3,
  },
  name: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  held: {
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
  fadedBtn: {
    backgroundColor: palette.ice,
    borderColor: palette.ice,
  },
  fadedText: {
    color: palette.bg,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  flaredBtn: {
    backgroundColor: 'transparent',
    borderColor: palette.border,
  },
  flaredText: {
    color: palette.textDim,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  honesty: {
    color: palette.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  verdict: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
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
  massTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.raised,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  massFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.flare,
  },
  massLabel: {
    color: palette.textDim,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },
  bare: {
    color: palette.ice,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  quiet: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '600',
  },
  quietLine: {
    color: palette.textDim,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: palette.ice,
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
