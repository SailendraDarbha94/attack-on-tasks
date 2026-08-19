import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BodyGlyph } from '@/components/BodyGlyph';
import { palette, spacing } from '@/constants/theme';
import { MISSIONS, type Mission, type MissionTask } from '@/content/missions';
import { bodyForHours } from '@/engine/bodies';
import {
  MISSIONS_COMET_REQUIRED,
  MISSIONS_RETURNS_REQUIRED,
  missionsProgress,
} from '@/engine/missions';
import { logbook } from '@/engine/system';
import { useGame } from '@/state/game';

// Each mission gets an accent and a drawn mark — no portraits, and nothing
// that has to be an image file.
const ACCENTS: Record<Mission['id'], string> = {
  opportunity: palette.flare,
  hubble: palette.ice,
  voyager: palette.amber,
};

export default function MissionsScreen() {
  const { events, worlds, commissionWorld } = useGame();
  const progress = useMemo(() => missionsProgress(logbook(events)), [events]);
  const commissioned = useMemo(
    () => new Set(worlds.map((w) => w.name.trim().toLowerCase())),
    [worlds],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.overline}>DEEP SPACE NETWORK</Text>

      {!progress.unlocked ? (
        <View style={styles.locked}>
          <Text style={styles.lockedTitle}>Three long-duration missions are listening elsewhere.</Text>
          <Text style={styles.lockedBody}>
            They have each outlived their own design life, so they only take notice of a keeper
            with a record to match: {MISSIONS_RETURNS_REQUIRED} worlds brought back on time, and
            at least one comet carried to perihelion. Keep the ephemeris and the downlink finds
            you.
          </Text>
          <ProgressLine
            label="WORLDS RETURNED"
            value={progress.returns}
            max={MISSIONS_RETURNS_REQUIRED}
          />
          <ProgressLine
            label="COMETS DISPERSED"
            value={progress.dispersed}
            max={MISSIONS_COMET_REQUIRED}
          />
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.arrived}>
            Three long-duration missions have your system in their downlink.
          </Text>
          {MISSIONS.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              commissioned={commissioned}
              onSummon={async (task) => {
                await commissionWorld(task.name, task.frequencyHours);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            />
          ))}
        </ScrollView>
      )}

      <Pressable style={styles.cta} onPress={() => router.back()}>
        <Text style={styles.ctaText}>BACK</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function ProgressLine({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <View style={styles.progress}>
      <Text style={styles.progressLabel}>
        {label} · {value} / {max}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(value / max) * 100}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

/** Geometry only: a wheel, an aperture, a transmission. */
function MissionMark({ id, color }: { id: Mission['id']; color: string }) {
  return (
    <View style={styles.mark}>
      {id === 'opportunity' ? (
        <View style={[styles.wheel, { borderColor: color }]}>
          <View style={[styles.wheelAxle, { backgroundColor: color }]} />
        </View>
      ) : null}
      {id === 'hubble' ? (
        <View style={[styles.aperture, { borderColor: color }]}>
          <View style={[styles.apertureCore, { backgroundColor: color }]} />
        </View>
      ) : null}
      {id === 'voyager' ? (
        <View style={styles.signal}>
          <View style={[styles.signalDot, { backgroundColor: color }]} />
          {[10, 17, 24].map((size, i) => (
            <View
              key={size}
              style={[
                styles.signalArc,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  left: -size / 2,
                  top: (24 - size) / 2,
                  borderColor: color,
                  opacity: 0.9 - i * 0.25,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MissionCard({
  mission,
  commissioned,
  onSummon,
}: {
  mission: Mission;
  commissioned: Set<string>;
  onSummon: (task: MissionTask) => Promise<void>;
}) {
  const accent = ACCENTS[mission.id];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MissionMark id={mission.id} color={accent} />
        <View style={styles.headerMeta}>
          <Text style={styles.name}>{mission.name}</Text>
          <Text style={[styles.virtue, { color: accent }]}>{mission.virtue}</Text>
        </View>
      </View>
      <Text style={styles.record}>{mission.record}</Text>
      <Text style={styles.line}>“{mission.line}”</Text>
      {mission.tasks.map((task) => {
        const body = bodyForHours(task.frequencyHours);
        const inOrbit = commissioned.has(task.name.trim().toLowerCase());
        return (
          <View key={task.name} style={styles.task}>
            <BodyGlyph body={body} size={26} />
            <View style={styles.taskMeta}>
              <Text style={styles.taskName}>{task.name}</Text>
              <Text style={styles.taskBody}>
                {body.name} · {body.cadence}
              </Text>
            </View>
            <Pressable
              style={[styles.summon, inOrbit && styles.summonDone]}
              disabled={inOrbit}
              onPress={() => onSummon(task)}
              hitSlop={6}
            >
              <Text style={[styles.summonText, inOrbit && styles.summonTextDone]}>
                {inOrbit ? 'IN ORBIT' : 'SUMMON'}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
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
  locked: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  lockedTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 29,
  },
  lockedBody: {
    color: palette.textDim,
    fontSize: 14,
    lineHeight: 21,
  },
  progress: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  progressLabel: {
    color: palette.ice,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.raised,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.ice,
  },
  list: {
    flex: 1,
    marginTop: spacing.md,
  },
  arrived: {
    color: palette.textDim,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.raised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wheel: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelAxle: {
    width: 22,
    height: 1.5,
  },
  aperture: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apertureCore: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  // Only the right half of each ring is visible, so the arcs read as a beam.
  signal: {
    width: 13,
    height: 24,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  signalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  signalArc: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  virtue: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  record: {
    color: palette.text,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.75,
  },
  line: {
    color: palette.textDim,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskMeta: {
    flex: 1,
  },
  taskName: {
    color: palette.text,
    fontSize: 14,
  },
  taskBody: {
    color: palette.textDim,
    fontSize: 11,
  },
  summon: {
    borderWidth: 1,
    borderColor: palette.ice,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  summonDone: {
    borderColor: palette.border,
  },
  summonText: {
    color: palette.ice,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summonTextDone: {
    color: palette.textDim,
  },
  cta: {
    backgroundColor: palette.ice,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  ctaText: {
    color: palette.bg,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
