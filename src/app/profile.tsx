import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing } from '@/constants/theme';
import { battleStats } from '@/engine/titanMath';
import { useGame } from '@/state/game';

export default function ProfileScreen() {
  const { game, events, startTs } = useGame();
  const stats = battleStats(events);
  const slainNow = Object.values(game.titans).filter((t) => !t.alive).length;

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.overline}>SCOUT PROFILE</Text>
      <View style={styles.hero}>
        <Image
          source={require('../../assets/characters/eren.png')}
          style={styles.figure}
          contentFit="contain"
        />
        <View style={styles.heroMeta}>
          <Text style={styles.name}>THE SCOUT</Text>
          <Text style={styles.since}>
            On watch since{' '}
            {startTs
              ? new Date(startTs).toLocaleDateString([], { month: 'short', day: 'numeric' })
              : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Stat label="ATTACK POWER" value={game.attackPower} />
        <Stat label="XP" value={game.xp} />
        <Stat label="STRIKES" value={stats.strikes} />
        <Stat label="TIMES FED" value={stats.relapses} />
        <Stat label="HONEST REPORTS" value={stats.answered} />
        <Stat label="TITANS SLAIN" value={slainNow} />
      </View>

      <Text style={styles.footnote}>
        Honesty is the mechanic. Every report — clean or not — sharpens the blades.
      </Text>

      <Pressable style={styles.cta} onPress={() => router.back()}>
        <Text style={styles.ctaText}>BACK TO THE FOREST</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  figure: {
    width: 56,
    height: 174,
  },
  heroMeta: {
    gap: spacing.xs,
  },
  name: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  since: {
    color: palette.textDim,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  stat: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: palette.steel,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: palette.textDim,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '700',
  },
  footnote: {
    color: palette.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  cta: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
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
