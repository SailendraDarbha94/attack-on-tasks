import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
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
import type { Answer, HabitId, TitanState } from '@/engine/types';
import { useGame } from '@/state/game';

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ForestScreen() {
  const { game, pending, settings, hydrated } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [cardHabit, setCardHabit] = useState<HabitId | null>(null);
  const [wallNote, setWallNote] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const upcoming = nextSlot(now, settings);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.overline}>FOREST OF THE GIANT TREES</Text>

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

      {/* the clearing: you on a branch, titans roaming below */}
      <View style={styles.scene}>
        <View style={styles.branch} />
        <Image
          source={require('../../assets/characters/eren.png')}
          style={styles.eren}
          contentFit="contain"
        />

        {Object.values(game.titans).map((titan, i) => (
          <RoamingTitan
            key={titan.habit}
            titan={titan}
            slot={i}
            onPress={() => setCardHabit(titan.habit)}
          />
        ))}

        <View style={styles.controls}>
          <Pressable style={styles.controlBtn} onPress={() => setWallNote(true)} hitSlop={8}>
            <Text style={styles.controlGlyph}>＋</Text>
          </Pressable>
          <Link href="/profile" asChild>
            <Pressable style={styles.controlBtn} hitSlop={8}>
              <Text style={styles.controlGlyph}>⚔</Text>
            </Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable style={styles.controlBtn} hitSlop={8}>
              <Text style={styles.controlGlyph}>⚙</Text>
            </Pressable>
          </Link>
        </View>

        {wallNote && (
          <Pressable style={styles.wallNote} onPress={() => setWallNote(false)}>
            <Text style={styles.wallNoteText}>
              Lesser Titans arrive with the next expedition. The walls aren't ready.
            </Text>
          </Pressable>
        )}
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

      <TitanCardModal habit={cardHabit} onClose={() => setCardHabit(null)} />
    </SafeAreaView>
  );
}

// ── a titan wandering the clearing, tap to open its card ─────────────────
function RoamingTitan({
  titan,
  slot,
  onPress,
}: {
  titan: TitanState;
  slot: number;
  onPress: () => void;
}) {
  const breathe = useSharedValue(1);
  const sway = useSharedValue(0);

  useEffect(() => {
    if (!titan.alive) return;
    breathe.value = withRepeat(
      withTiming(1.04, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    sway.value = withRepeat(
      withTiming(slot % 2 === 0 ? 10 : -10, {
        duration: 5200 + slot * 900,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [breathe, sway, slot, titan.alive]);

  const roam = useAnimatedStyle(() => ({
    transform: [{ translateX: sway.value }, { scale: breathe.value }],
  }));

  // size is visible in the world: a fed titan looms, a starved one shrinks
  const height = titan.alive ? 110 + Math.round((titan.size / MAX_SIZE) * 130) : 110;

  return (
    <Animated.View
      style={[
        styles.roamer,
        slot % 2 === 0 ? styles.roamerLeft : styles.roamerRight,
        titan.alive ? undefined : styles.roamerSlain,
        roam,
      ]}
    >
      <Pressable onPress={onPress} hitSlop={6}>
        <TitanFigure habit={titan.habit} pose={titan.alive ? 'idle' : 'dying'} height={height} />
      </Pressable>
    </Animated.View>
  );
}

// ── the titan card: ⊗ it fed · ⓘ details · ✓ stayed clean ────────────────
function TitanCardModal({ habit, onClose }: { habit: HabitId | null; onClose: () => void }) {
  const { game, pending, settings, answer } = useGame();
  const [showDetails, setShowDetails] = useState(false);
  const [verdict, setVerdict] = useState<Answer | null>(null);

  useEffect(() => {
    setShowDetails(false);
    setVerdict(null);
  }, [habit]);

  if (!habit) return null;
  const titan = game.titans[habit];
  const def = TITANS[habit];
  const report = pending.find((p) => p.habit === habit);
  const sizePct = Math.round((titan.size / MAX_SIZE) * 100);

  const onReport = async (ans: Answer) => {
    if (!report) return;
    await answer(report, ans);
    setVerdict(ans);
    if (ans === 'no') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.cardName}>{def.name}</Text>
          <View style={styles.cardStage}>
            <TitanFigure
              habit={habit}
              pose={!titan.alive ? 'dying' : verdict ? (verdict === 'no' ? 'flinch' : 'grown') : 'idle'}
              height={190}
            />
          </View>

          {verdict ? (
            <Text style={[styles.verdict, { color: verdict === 'no' ? palette.steel : palette.blood }]}>
              {verdict === 'no' ? def.onNo : def.onYes}
            </Text>
          ) : (
            <Text style={styles.cardEpithet}>{titan.alive ? def.epithet : 'Slain. The forest remembers.'}</Text>
          )}

          <View style={styles.sizeTrack}>
            <View style={[styles.sizeFill, { width: `${sizePct}%` as `${number}%` }]} />
          </View>
          <Text style={styles.sizeLabel}>
            STRENGTH {titan.size} / {MAX_SIZE}
            {titan.finisherReady ? '  ·  FINISHER READY' : ''}
          </Text>

          {showDetails && (
            <View style={styles.details}>
              <Text style={styles.detailLine}>“{def.taunt}”</Text>
              <Text style={styles.detailMeta}>
                {report
                  ? `Stirring since ${formatClock(report.slotTs)} — it awaits your report.`
                  : titan.alive
                    ? 'Calm for now. It will stir at the next emergence.'
                    : 'This one will trouble the forest no more.'}
              </Text>
              <Text style={styles.detailMeta}>
                Every honest report is XP. Stale reports expire — the titan wanders off, unfed
                and unhurt.
              </Text>
            </View>
          )}

          {!verdict && titan.alive && (
            <View style={styles.reportRow}>
              <ReportButton
                glyph="⊗"
                label="IT FED"
                tone="blood"
                disabled={!report}
                onPress={() => onReport('yes')}
              />
              <ReportButton
                glyph="ⓘ"
                label="DETAILS"
                tone="dim"
                disabled={false}
                onPress={() => setShowDetails((v) => !v)}
              />
              <ReportButton
                glyph="✓"
                label="STAYED CLEAN"
                tone="steel"
                disabled={!report}
                onPress={() => onReport('no')}
              />
            </View>
          )}

          {!verdict && titan.alive && !report && (
            <Text style={styles.noReport}>
              Nothing to report — it hasn't stirred since your last watch.
            </Text>
          )}

          {verdict && (
            <Pressable style={styles.closeCta} onPress={onClose}>
              <Text style={styles.closeCtaText}>LEAVE THE CLEARING</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ReportButton({
  glyph,
  label,
  tone,
  disabled,
  onPress,
}: {
  glyph: string;
  label: string;
  tone: 'blood' | 'steel' | 'dim';
  disabled: boolean;
  onPress: () => void;
}) {
  const color = tone === 'blood' ? palette.blood : tone === 'steel' ? palette.steel : palette.textDim;
  return (
    <Pressable
      style={[styles.reportBtn, { borderColor: color }, disabled && styles.reportBtnDisabled]}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
    >
      <Text style={[styles.reportGlyph, { color }]}>{glyph}</Text>
      <Text style={[styles.reportLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: spacing.lg,
  },
  overline: {
    color: palette.textDim,
    fontSize: 12,
    letterSpacing: 3,
    marginTop: spacing.lg,
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
  scene: {
    flex: 1,
    marginTop: spacing.sm,
  },
  branch: {
    position: 'absolute',
    top: 128,
    left: -spacing.lg,
    width: '58%',
    height: 18,
    backgroundColor: '#2E2013',
    borderColor: '#1D1409',
    borderWidth: 2,
    borderRadius: 9,
    transform: [{ rotate: '-4deg' }],
  },
  eren: {
    position: 'absolute',
    top: 14,
    left: 34,
    width: 38,
    height: 118,
    zIndex: 2,
  },
  roamer: {
    position: 'absolute',
    bottom: 6,
  },
  roamerLeft: {
    left: '4%',
  },
  roamerRight: {
    right: '4%',
  },
  roamerSlain: {
    opacity: 0.45,
  },
  controls: {
    position: 'absolute',
    left: 0,
    top: 190,
    gap: spacing.sm,
    zIndex: 3,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlGlyph: {
    color: palette.steel,
    fontSize: 18,
  },
  wallNote: {
    position: 'absolute',
    left: 52,
    top: 190,
    right: spacing.lg,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    zIndex: 4,
  },
  wallNoteText: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 18,
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 6, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardName: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardStage: {
    marginVertical: spacing.xs,
  },
  cardEpithet: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  verdict: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  sizeTrack: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.raised,
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
  details: {
    alignSelf: 'stretch',
    borderTopColor: palette.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  detailLine: {
    color: palette.textDim,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  detailMeta: {
    color: palette.textDim,
    fontSize: 12,
    lineHeight: 17,
  },
  reportRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  reportBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  reportBtnDisabled: {
    opacity: 0.35,
  },
  reportGlyph: {
    fontSize: 20,
    fontWeight: '700',
  },
  reportLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  noReport: {
    color: palette.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
  closeCta: {
    alignSelf: 'stretch',
    backgroundColor: palette.steel,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  closeCtaText: {
    color: palette.bg,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
