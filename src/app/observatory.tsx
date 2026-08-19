import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing } from '@/constants/theme';
import { logbook, loggingStreak } from '@/engine/system';
import type { GameEvent, ScheduleSettings, World } from '@/engine/types';
import { useGame } from '@/state/game';

export default function ObservatoryScreen() {
  const { game, events, worlds, settings, startTs } = useGame();
  const log = useMemo(() => logbook(events), [events]);
  const streak = useMemo(() => loggingStreak(events, Date.now()), [events]);
  const [showRecord, setShowRecord] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.overline}>OBSERVATORY</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.name}>THE KEEPER</Text>
        <Text style={styles.since}>
          Keeping this system since{' '}
          {startTs
            ? new Date(startTs).toLocaleDateString([], {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'today'}
          .
        </Text>
        <Text style={styles.streak}>
          {streak === 0
            ? 'The count starts with your next observation.'
            : `${streak} ${streak === 1 ? 'day' : 'days'} logged in a row.`}
        </Text>

        <View style={styles.grid}>
          <Headline label="LUMINOSITY" value={game.luminosity} gloss="your star's output" />
          <Headline label="LIGHT" value={game.light} gloss="total gathered" />
          <Headline
            label="OBSERVATIONS"
            value={log.observations}
            gloss="questions answered honestly"
          />
          <Headline
            label="RETURNS"
            value={log.returns}
            gloss="worlds brought back on time"
          />
          <Headline
            label="POPULATION"
            value={game.population.toLocaleString()}
            gloss="souls at home"
          />
        </View>

        <Pressable
          style={styles.disclosure}
          onPress={() => setShowRecord((open) => !open)}
          hitSlop={8}
        >
          <Text style={styles.disclosureLabel}>THE REST OF THE RECORD</Text>
          <Text style={styles.disclosureToggle}>{showRecord ? 'HIDE' : 'SHOW'}</Text>
        </Pressable>
        {showRecord ? (
          <View style={styles.outburstPanel}>
            <View style={styles.recordRow}>
              <View style={styles.recordStat}>
                <Text style={styles.outburstValue}>{log.outbursts}</Text>
                <Text style={styles.recordLabel}>OUTBURSTS</Text>
              </View>
              <View style={styles.recordStat}>
                <Text style={styles.deflectedValue}>{log.deflected}</Text>
                <Text style={styles.recordLabel}>DEFLECTIONS</Text>
              </View>
              <View style={styles.recordStat}>
                <Text style={styles.craterValue}>{log.struck}</Text>
                <Text style={styles.recordLabel}>CRATERS</Text>
              </View>
            </View>
            <Text style={styles.outburstBody}>
              Outbursts are data. They are how you know the record is honest.
            </Text>
            <Text style={styles.outburstBody}>
              Deflections are asteroids turned away in time. Craters are the ones that landed —
              part of the record, nothing more. The record goes on.
            </Text>
            <Text style={styles.outburstAside}>
              Recorded across {log.observations}{' '}
              {log.observations === 1 ? 'observation' : 'observations'}.
            </Text>
          </View>
        ) : null}

        <View style={styles.lifeboat}>
          <Text style={styles.lifeboatTitle}>Local-only data deserves a lifeboat.</Text>
          <Text style={styles.lifeboatBody}>
            Every observation, return and outburst lives on this device and nowhere else. The
            export is the whole log, verbatim — take a copy somewhere it will keep.
          </Text>
          <ExportButton startTs={startTs} events={events} worlds={worlds} settings={settings} />
        </View>

        <Text style={styles.credit}>
          The bodies are NASA photographs, public domain: SDO's sun, Apollo 17's Earth,
          MESSENGER's Mercury, Magellan's Venus, LRO's Moon, Viking's Mars, Voyager's Jupiter,
          Uranus and Neptune, Cassini's Saturn, OSIRIS-REx's Bennu.
        </Text>
      </ScrollView>

      <Pressable style={styles.cta} onPress={() => router.back()}>
        <Text style={styles.ctaText}>BACK TO THE PLANE</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Headline({
  label,
  value,
  gloss,
}: {
  label: string;
  value: number | string;
  gloss: string;
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileGloss}>{gloss}</Text>
    </View>
  );
}

interface ExportButtonProps {
  startTs: number;
  events: GameEvent[];
  worlds: World[];
  settings: ScheduleSettings;
}

// expo-sharing is not a dependency of this project, so the lifeboat goes out
// through React Native's own Share sheet with the log serialized as a string
// rather than written to a file and shared as a URL. Nothing else on the
// device holds this data, so failures are reported rather than swallowed.
function ExportButton({ startTs, events, worlds, settings }: ExportButtonProps) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const exportLog = async () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const json = JSON.stringify(
        { app: 'orrery', format: 1, exportedTs: Date.now(), startTs, settings, worlds, events },
        null,
        2,
      );
      const result = await Share.share(
        { message: json, title: 'Orrery log' },
        { subject: 'Orrery log', dialogTitle: 'Orrery log' },
      );
      setNote(
        result.action === Share.dismissedAction
          ? 'Not this pass. The log is untouched.'
          : `${events.length} ${events.length === 1 ? 'entry' : 'entries'} left the device. Nothing here changed.`,
      );
    } catch (err) {
      console.warn('log export failed', err);
      setNote('The share sheet would not open. The log is intact — try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable style={[styles.export, busy && styles.exportBusy]} onPress={exportLog} disabled={busy}>
        <Text style={styles.exportText}>{busy ? 'PREPARING…' : 'EXPORT THE LOG'}</Text>
      </Pressable>
      {note ? <Text style={styles.exportNote}>{note}</Text> : null}
    </>
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  name: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  since: {
    color: palette.textDim,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  streak: {
    color: palette.ice,
    fontSize: 13,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  tileValue: {
    color: palette.ice,
    fontSize: 30,
    fontWeight: '800',
  },
  tileLabel: {
    color: palette.text,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  tileGloss: {
    color: palette.textDim,
    fontSize: 11,
    lineHeight: 15,
  },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  disclosureLabel: {
    color: palette.textDim,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  disclosureToggle: {
    color: palette.ice,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  outburstPanel: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
  },
  recordRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recordStat: {
    flex: 1,
    gap: 2,
  },
  recordLabel: {
    color: palette.textDim,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  outburstValue: {
    color: palette.flare,
    fontSize: 30,
    fontWeight: '800',
  },
  deflectedValue: {
    color: palette.ice,
    fontSize: 30,
    fontWeight: '800',
  },
  craterValue: {
    color: palette.amber,
    fontSize: 30,
    fontWeight: '800',
  },
  outburstBody: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 20,
  },
  outburstAside: {
    color: palette.textDim,
    fontSize: 12,
  },
  lifeboat: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  lifeboatTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  lifeboatBody: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 19,
  },
  credit: {
    color: palette.textDim,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  export: {
    borderWidth: 1,
    borderColor: palette.ice,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  exportBusy: {
    opacity: 0.5,
  },
  exportText: {
    color: palette.ice,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  exportNote: {
    color: palette.textDim,
    fontSize: 12,
    lineHeight: 17,
  },
  cta: {
    backgroundColor: palette.ice,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ctaText: {
    color: palette.bg,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
