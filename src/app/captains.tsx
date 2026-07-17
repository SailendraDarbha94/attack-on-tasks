import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing } from '@/constants/theme';
import { CAPTAINS, type Captain, type CaptainQuest } from '@/content/captains';
import {
  CAPTAINS_BOSS_KILLS_REQUIRED,
  CAPTAINS_CHORE_KILLS_REQUIRED,
  captainsProgress,
} from '@/engine/captains';
import { battleStats } from '@/engine/titanMath';
import { useGame } from '@/state/game';

export default function CaptainsScreen() {
  const { events, chores, addChore } = useGame();
  const progress = captainsProgress(battleStats(events));

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.overline}>SCOUT REGIMENT · COMMAND</Text>

      {!progress.unlocked ? (
        <View style={styles.locked}>
          <Text style={styles.lockedTitle}>The captains have not taken notice. Yet.</Text>
          <Text style={styles.lockedBody}>
            Word of a promising Scout travels slowly through the regiment. Fell{' '}
            {CAPTAINS_CHORE_KILLS_REQUIRED} lesser Titans and bring down{' '}
            {CAPTAINS_BOSS_KILLS_REQUIRED === 1 ? 'one boss' : `${CAPTAINS_BOSS_KILLS_REQUIRED} bosses`},
            and the three captains will seek you out with trials of their own.
          </Text>
          <ProgressLine
            label="LESSER TITANS FELLED"
            value={progress.choreKills}
            max={CAPTAINS_CHORE_KILLS_REQUIRED}
          />
          <ProgressLine
            label="BOSSES SLAIN"
            value={progress.bossKills}
            max={CAPTAINS_BOSS_KILLS_REQUIRED}
          />
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.arrived}>
            Three riders came through the trees at dawn. They were watching all along.
          </Text>
          {CAPTAINS.map((captain) => (
            <CaptainCard
              key={captain.id}
              captain={captain}
              activeQuests={chores.map((c) => c.name)}
              onSummon={async (quest) => {
                await addChore(quest.name, quest.frequencyHours);
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

function CaptainCard({
  captain,
  activeQuests,
  onSummon,
}: {
  captain: Captain;
  activeQuests: string[];
  onSummon: (quest: CaptainQuest) => Promise<void>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {captain.id === 'levi' ? (
          <Image
            source={require('../../assets/characters/levi-portrait.jpg')}
            style={styles.portrait}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{captain.name.split(' ').pop()![0]}</Text>
          </View>
        )}
        <View style={styles.headerMeta}>
          <Text style={styles.name}>{captain.name}</Text>
          <Text style={styles.virtue}>{captain.virtue}</Text>
        </View>
      </View>
      <Text style={styles.line}>“{captain.line}”</Text>
      {captain.quests.map((quest) => {
        const walking = activeQuests.includes(quest.name);
        return (
          <View key={quest.name} style={styles.quest}>
            <Text style={styles.questName}>{quest.name}</Text>
            <Pressable
              style={[styles.summon, walking && styles.summonDone]}
              disabled={walking}
              onPress={() => onSummon(quest)}
              hitSlop={6}
            >
              <Text style={[styles.summonText, walking && styles.summonTextDone]}>
                {walking ? 'IT WALKS' : 'SUMMON'}
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
    color: palette.steel,
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
    backgroundColor: palette.steel,
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
  portrait: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: palette.steel,
    fontSize: 20,
    fontWeight: '800',
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  virtue: {
    color: palette.steel,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  line: {
    color: palette.textDim,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  quest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  questName: {
    color: palette.text,
    fontSize: 14,
    flex: 1,
  },
  summon: {
    borderWidth: 1,
    borderColor: palette.steel,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  summonDone: {
    borderColor: palette.border,
  },
  summonText: {
    color: palette.steel,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summonTextDone: {
    color: palette.textDim,
  },
  cta: {
    backgroundColor: palette.steel,
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
