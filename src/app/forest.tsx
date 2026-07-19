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

import { playSfx } from '@/audio/sfx';
import { EmberField } from '@/components/EmberField';
import {
  FallingLeaves,
  Fireflies,
  LightShaft,
  MistBand,
  useWander,
} from '@/components/ForestAmbience';
import { useShake } from '@/components/useShake';
import { StrikeEffect } from '@/components/StrikeEffect';
import { TitanFigure } from '@/components/TitanFigure';
import { palette, spacing } from '@/constants/theme';
import { TITANS } from '@/content/titans';
import { choreTitans, type ChoreTitanState } from '@/engine/chores';
import { nextSlot } from '@/engine/schedule';
import { MAX_SIZE, XP_CHORE } from '@/engine/titanMath';
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

const cadenceText = (hours: number) =>
  hours === 12
    ? 'twice a day'
    : hours === 24
      ? 'every day'
      : hours === 168
        ? 'every week'
        : `every ${hours / 24} days`;

export default function ForestScreen() {
  const { game, pending, settings, hydrated, chores, events } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [cardHabit, setCardHabit] = useState<HabitId | null>(null);
  const [cardChoreId, setCardChoreId] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const upcoming = nextSlot(now, settings);
  const dueChores = choreTitans(chores, events, now).filter((c) => c.due);
  const roamingChores = dueChores.slice(0, 4);
  const hiddenChores = dueChores.length - roamingChores.length;

  // Proportional scene layout, measured — never let a titan reach the branch
  // and never push chrome off-screen, regardless of device or banners.
  const [sceneH, setSceneH] = useState(0);
  const [sceneW, setSceneW] = useState(0);
  const perchH = Math.min(230, Math.max(140, Math.round(sceneH * 0.4)));
  const branchY = Math.round(perchH * 0.56);
  const maxTitanH = Math.max(100, sceneH - branchY - 30);

  // the watcher's camera sways gently; layers drift at different rates
  const cam = useSharedValue(0);
  useEffect(() => {
    cam.value = withRepeat(
      withTiming(1, { duration: 26_000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [cam]);
  const bgDrift = useAnimatedStyle(() => ({
    transform: [{ translateX: (cam.value - 0.5) * 16 }, { scale: 1.05 }],
  }));
  const shaftDrift = useAnimatedStyle(() => ({
    transform: [{ translateX: (cam.value - 0.5) * 30 }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View pointerEvents="none" style={[styles.sceneBackdrop, bgDrift]}>
        <Image
          source={require('../../assets/scenery/forest-bg.png')}
          style={styles.sceneBackdrop}
          contentFit="cover"
        />
      </Animated.View>
      <View
        pointerEvents="none"
        style={[styles.sceneBackdrop, { backgroundColor: dayTint(new Date(now).getHours()) }]}
      />
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
      <View
        style={styles.scene}
        onLayout={(e) => {
          setSceneH(Math.round(e.nativeEvent.layout.height));
          setSceneW(Math.round(e.nativeEvent.layout.width));
        }}
      >
        {sceneH > 0 && (
          <>
            <Image
              source={require('../../assets/scenery/trunk.png')}
              style={[styles.trunk, { width: Math.round(perchH * 0.32), height: sceneH }]}
              contentFit="fill"
              pointerEvents="none"
            />
            <Animated.View pointerEvents="none" style={[styles.shaftLayer, shaftDrift]}>
              <LightShaft left={44} angle={-8} period={14_000} height={sceneH} />
              <LightShaft left={180} angle={-8} period={19_000} phase={2.4} height={sceneH} />
              <LightShaft left={306} angle={-8} period={23_000} phase={4.1} height={sceneH} />
            </Animated.View>
            <MistBand bottom={30} height={20} opacity={0.05} duration={34_000} />
            <CanopyPerch height={perchH} />

            {Object.values(game.titans).map((titan, i) => (
              <RoamingTitan
                key={titan.habit}
                titan={titan}
                slot={i}
                maxHeight={maxTitanH}
                onPress={() => setCardHabit(titan.habit)}
              />
            ))}

            {roamingChores.map((state, i) => (
              <RoamingChore
                key={state.chore.id}
                state={state}
                slot={i}
                sceneH={sceneH}
                branchY={branchY}
                onPress={() => setCardChoreId(state.chore.id)}
              />
            ))}

            <MistBand bottom={0} height={40} opacity={0.12} duration={26_000} />
            <MistBand bottom={14} height={24} opacity={0.08} duration={42_000} />
            <Fireflies />
            <EmberField width={sceneW} height={sceneH} />
            <FallingLeaves drop={Math.round(sceneH * 0.92)} />

            <View
              style={[
                styles.trunkControls,
                {
                  left: Math.max(4, -10 + Math.round((perchH * 0.32) / 2) - 20),
                  top: branchY + 30,
                },
              ]}
            >
              <Link href="/add-titan" asChild>
                <Pressable style={styles.controlBtn} hitSlop={8}>
                  <Text style={styles.controlGlyph}>＋</Text>
                </Pressable>
              </Link>
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

            {hiddenChores > 0 && (
              <Text style={styles.hiddenChores}>
                +{hiddenChores} more stir beyond the treeline
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerStats} numberOfLines={1}>
          AP {game.attackPower} · XP {game.xp}
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
      <ChoreCardModal choreId={cardChoreId} onClose={() => setCardChoreId(null)} />
      </SafeAreaView>
      <Image
        source={require('../../assets/scenery/vignette.png')}
        style={styles.sceneBackdrop}
        contentFit="fill"
        pointerEvents="none"
      />
    </View>
  );
}

// The forest lives on your clock: cold before dawn, warm at dusk.
function dayTint(hour: number): string {
  if (hour < 5) return 'rgba(10, 22, 34, 0.35)';
  if (hour < 8) return 'rgba(56, 82, 60, 0.16)';
  if (hour < 12) return 'rgba(44, 78, 48, 0.13)';
  if (hour < 16) return 'rgba(28, 52, 36, 0.08)';
  if (hour < 19) return 'rgba(122, 84, 34, 0.14)';
  if (hour < 22) return 'rgba(14, 26, 28, 0.3)';
  return 'rgba(8, 16, 22, 0.4)';
}

// ── the branch you watch from, swaying with the canopy ───────────────────
// All internal geometry derives from the measured perch height so Eren's
// feet stay planted on the branch on every screen size.
function CanopyPerch({ height }: { height: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t]);

  const sway = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(t.value - 0.5) * 0.8}deg` }],
  }));

  const treeW = Math.round(height * (1000 / 760));
  const branchY = Math.round(height * 0.56);
  const erenH = Math.round(height * 0.4);
  const erenW = Math.round(erenH * 0.3);

  return (
    <Animated.View pointerEvents="none" style={[styles.perch, { height }, sway]}>
      <Image
        source={require('../../assets/scenery/tree-branch.png')}
        style={{ position: 'absolute', top: 0, left: -12, width: treeW, height }}
        contentFit="contain"
      />
      <Image
        source={require('../../assets/characters/eren.png')}
        style={{
          position: 'absolute',
          top: branchY - erenH + 2,
          left: Math.round(treeW * 0.42) - Math.round(erenW / 2),
          width: erenW,
          height: erenH,
        }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

// ── a titan wandering the clearing, tap to open its card ─────────────────
function RoamingTitan({
  titan,
  slot,
  maxHeight,
  onPress,
}: {
  titan: TitanState;
  slot: number;
  maxHeight: number;
  onPress: () => void;
}) {
  const roam = useWander({
    range: 30,
    period: 11_000 + slot * 2600,
    bob: 4,
    tilt: 1.4,
    phase: slot * 1.7,
    enabled: titan.alive,
  });

  // size is visible in the world: a fed titan looms, a starved one shrinks —
  // but no titan may ever reach the branch you stand on
  const wanted = titan.alive ? 110 + Math.round((titan.size / MAX_SIZE) * 130) : 110;
  const height = Math.min(wanted, maxHeight);

  return (
    <Animated.View
      style={[
        styles.roamer,
        slot % 2 === 0 ? styles.roamerLeft : styles.roamerRight,
        titan.alive ? undefined : styles.roamerSlain,
        roam,
      ]}
    >
      <View style={[styles.contactShadow, { width: Math.round(height * 0.5) }]} />
      <Pressable onPress={onPress} hitSlop={6}>
        <TitanFigure habit={titan.habit} pose={titan.alive ? 'walk' : 'dying'} height={height} />
      </Pressable>
    </Animated.View>
  );
}

// ── a due chore stalking the clearing, smaller than the bosses ────────────
// Depth slots as fractions of the scene, so they scale with the screen.
const CHORE_SLOTS = [
  { left: '34%' as const, f: 0.02 },
  { left: '14%' as const, f: 0.2 },
  { right: '30%' as const, f: 0.24 },
  { left: '48%' as const, f: 0.3 },
];

function RoamingChore({
  state,
  slot,
  sceneH,
  branchY,
  onPress,
}: {
  state: ChoreTitanState;
  slot: number;
  sceneH: number;
  branchY: number;
  onPress: () => void;
}) {
  const roam = useWander({
    range: 20,
    period: 6800 + slot * 1400,
    bob: 3,
    tilt: 1.8,
    phase: 2.3 + slot * 2.1,
  });

  const { f, ...position } = CHORE_SLOTS[slot] ?? CHORE_SLOTS[0];
  const bottom = Math.round(sceneH * f);
  // undone work looms a little larger each day, but never becomes a boss —
  // and never climbs high enough to reach the branch
  const wanted = 84 + Math.round(state.menace * 56);
  const height = Math.max(60, Math.min(wanted, sceneH - bottom - branchY - 26));

  return (
    <Animated.View style={[styles.roamer, position, { bottom }, roam]}>
      <View style={[styles.contactShadow, { width: Math.round(height * 0.5) }]} />
      <Pressable onPress={onPress} hitSlop={6}>
        <TitanFigure habit="chore" height={height} />
      </Pressable>
    </Animated.View>
  );
}

// ── the chore card: ⊗ not today · ⓘ details · ✓ done ─────────────────────
function ChoreCardModal({ choreId, onClose }: { choreId: number | null; onClose: () => void }) {
  const { chores, events, completeChore, skipChore, releaseChore } = useGame();
  const [showDetails, setShowDetails] = useState(false);
  const [verdict, setVerdict] = useState<'done' | 'skip' | null>(null);
  const shake = useShake();

  useEffect(() => {
    setShowDetails(false);
    setVerdict(null);
  }, [choreId]);

  if (choreId == null) return null;
  const state = choreTitans(chores, events, Date.now()).find((c) => c.chore.id === choreId);
  if (!state) return null;
  const { chore } = state;

  const onDone = async () => {
    await completeChore(chore.id);
    setVerdict('done');
    playSfx('kill');
    shake.trigger(7);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 130);
  };

  const onSkip = async () => {
    await skipChore(chore.id);
    setVerdict('skip');
    Haptics.selectionAsync();
  };

  const onRelease = async () => {
    await releaseChore(chore.id);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={shake.style}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.cardName}>{chore.name.toUpperCase()}</Text>
          <Text style={styles.choreKind}>LESSER TITAN</Text>
          <View style={styles.cardStage}>
            <TitanFigure habit="chore" pose={verdict === 'done' ? 'dying' : 'idle'} height={170} />
            {verdict === 'done' && <StrikeEffect size={200} />}
          </View>

          {verdict === 'done' ? (
            <Text style={[styles.verdict, { color: palette.steel }]}>
              Your blades flash. The work is done — it crumbles to steam. +{XP_CHORE} XP.
            </Text>
          ) : verdict === 'skip' ? (
            <Text style={styles.cardEpithet}>
              It lumbers off into the trees, unhurt. It will return tomorrow.
            </Text>
          ) : (
            <Text style={styles.cardEpithet}>
              {state.overdueDays > 0
                ? `It has fattened on ${state.overdueDays} ${state.overdueDays === 1 ? 'day' : 'days'} of undone work.`
                : 'It stirs in the clearing, waiting on the work.'}
            </Text>
          )}

          {showDetails && !verdict && (
            <View style={styles.details}>
              <Text style={styles.detailMeta}>
                Returns {cadenceText(chore.frequencyHours)} once slain. Killing it sharpens your
                blades against the bosses.
              </Text>
              <Pressable onPress={onRelease} hitSlop={6}>
                <Text style={styles.release}>RELEASE THIS TITAN (remove the task)</Text>
              </Pressable>
            </View>
          )}

          {!verdict ? (
            <View style={styles.reportRow}>
              <ReportButton glyph="⊗" label="NOT TODAY" tone="dim" disabled={false} onPress={onSkip} />
              <ReportButton
                glyph="ⓘ"
                label="DETAILS"
                tone="dim"
                disabled={false}
                onPress={() => setShowDetails((v) => !v)}
              />
              <ReportButton glyph="✓" label="DONE" tone="steel" disabled={false} onPress={onDone} />
            </View>
          ) : (
            <Pressable style={styles.closeCta} onPress={onClose}>
              <Text style={styles.closeCtaText}>LEAVE THE CLEARING</Text>
            </Pressable>
          )}
        </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ── the titan card: ⊗ it fed · ⓘ details · ✓ stayed clean ────────────────
function TitanCardModal({ habit, onClose }: { habit: HabitId | null; onClose: () => void }) {
  const { game, pending, settings, answer, killTitan } = useGame();
  const [showDetails, setShowDetails] = useState(false);
  const [verdict, setVerdict] = useState<Answer | 'kill' | null>(null);
  const shake = useShake();

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
    if (ans === 'no') {
      playSfx('strike');
      shake.trigger(6);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 130);
    } else {
      playSfx('grow');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const onFinisher = async () => {
    await killTitan(habit!);
    setVerdict('kill');
    playSfx('kill');
    shake.trigger(11);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid), 320);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={shake.style}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.cardName}>{def.name}</Text>
          <View style={styles.cardStage}>
            {verdict === 'kill' && habit === 'drink' ? (
              <Image
                source={require('../../assets/titans/drink-finisher.jpg')}
                style={styles.finisherStill}
                contentFit="cover"
              />
            ) : (
              <TitanFigure
                habit={habit}
                pose={!titan.alive ? 'dying' : verdict ? (verdict === 'no' ? 'flinch' : 'grown') : 'idle'}
                height={190}
              />
            )}
            {(verdict === 'no' || verdict === 'kill') && <StrikeEffect size={220} />}
          </View>

          {verdict ? (
            <Text style={[styles.verdict, { color: verdict === 'yes' ? palette.blood : palette.steel }]}>
              {verdict === 'kill'
                ? `The nape opens. Steam pours out — ${def.name} falls, and the forest goes quiet.`
                : verdict === 'no'
                  ? def.onNo
                  : def.onYes}
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

          {!verdict && titan.alive && titan.finisherReady && (
            <Pressable style={styles.finisher} onPress={onFinisher}>
              <Text style={styles.finisherText}>⚔ DELIVER THE FINISHING BLOW</Text>
            </Pressable>
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
        </Animated.View>
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
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  sceneBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
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
  perch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  contactShadow: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#030607',
    opacity: 0.55,
  },
  trunk: {
    position: 'absolute',
    top: 0,
    left: -10,
    zIndex: 1,
  },
  shaftLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trunkControls: {
    position: 'absolute',
    gap: spacing.sm,
    zIndex: 3,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 18, 9, 0.92)',
    borderColor: '#4A3520',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlGlyph: {
    color: palette.steel,
    fontSize: 18,
  },
  hiddenChores: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    color: palette.textDim,
    fontSize: 11,
    letterSpacing: 1,
  },
  choreKind: {
    color: palette.textDim,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  release: {
    color: palette.blood,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: spacing.xs,
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
  finisherStill: {
    width: 260,
    height: 190,
    borderRadius: 14,
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
  finisher: {
    alignSelf: 'stretch',
    backgroundColor: palette.blood,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  finisherText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
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
