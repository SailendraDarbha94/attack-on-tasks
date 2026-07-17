import { useState } from 'react';
import { ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing } from '@/constants/theme';
import { leviGreeting } from '@/content/levi';
import {
  CAPTAINS_BOSS_KILLS_REQUIRED,
  CAPTAINS_CHORE_KILLS_REQUIRED,
  captainsProgress,
} from '@/engine/captains';
import { battleStats } from '@/engine/titanMath';
import { useGame } from '@/state/game';

// Landing screen: Captain Levi greets the Scout on every launch,
// his tone tracking how many honest strikes you've landed.
export default function LandingScreen() {
  const { events, hydrated } = useGame();
  const [showInfo, setShowInfo] = useState(false);
  const stats = battleStats(events);
  const greeting = leviGreeting(stats.strikes);
  const captains = captainsProgress(stats);

  return (
    <ImageBackground
      source={require('../../assets/characters/levi-odm.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.scrim} />
      <SafeAreaView style={styles.screen}>
        <View style={styles.topRow}>
          <Text style={styles.overline}>SCOUT REGIMENT · SPECIAL OPERATIONS</Text>
          <Pressable style={styles.infoBtn} onPress={() => setShowInfo(true)} hitSlop={10}>
            <Text style={styles.infoGlyph}>ⓘ</Text>
          </Pressable>
        </View>
        <View style={styles.spacer} />
        {captains.unlocked && (
          <Link href="/captains" asChild>
            <Pressable style={styles.captainsCta}>
              <Text style={styles.captainsCtaText}>⚔ THE THREE CAPTAINS AWAIT</Text>
            </Pressable>
          </Link>
        )}
        <View style={styles.dialogue}>
          <View style={styles.speakerRow}>
            <Image
              source={require('../../assets/characters/levi-portrait.jpg')}
              style={styles.portrait}
            />
            <View style={styles.speakerMeta}>
              <Text style={styles.speaker}>CAPTAIN LEVI</Text>
              <Text style={styles.record}>
                {hydrated ? `${stats.strikes} confirmed strikes` : 'reviewing your record…'}
              </Text>
            </View>
          </View>
          <Text style={styles.line}>“{greeting.line}”</Text>
          <Text style={styles.aside}>“{greeting.aside}”</Text>
        </View>
        <Pressable style={styles.cta} onPress={() => router.replace('/forest')}>
          <Text style={styles.ctaText}>ENTER THE FOREST</Text>
        </Pressable>

        <Modal
          visible={showInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfo(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setShowInfo(false)}>
            <Pressable style={styles.infoCard} onPress={() => {}}>
              <Text style={styles.infoTitle}>THE THREE CAPTAINS</Text>
              <Text style={styles.infoBody}>
                Word of a promising Scout travels through the regiment. Fell{' '}
                {CAPTAINS_CHORE_KILLS_REQUIRED} lesser Titans and bring down one of the two bosses,
                and the three captains — Levi, Hange, and Erwin — will seek you out with trials of
                their own: strength, knowledge, and willpower.
              </Text>
              <Text style={styles.infoProgress}>
                LESSER TITANS FELLED · {captains.choreKills} / {CAPTAINS_CHORE_KILLS_REQUIRED}
              </Text>
              <Text style={styles.infoProgress}>
                BOSSES SLAIN · {captains.bossKills} / {CAPTAINS_BOSS_KILLS_REQUIRED}
              </Text>
              <Text style={styles.infoHint}>
                A boss falls only to the finishing blow — starve it below strength 10 first, then
                open its card in the forest.
              </Text>
              <Pressable style={styles.infoClose} onPress={() => setShowInfo(false)}>
                <Text style={styles.infoCloseText}>UNDERSTOOD</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.bg,
    opacity: 0.45,
  },
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  overline: {
    color: palette.text,
    fontSize: 12,
    letterSpacing: 3,
    textShadowColor: palette.bg,
    textShadowRadius: 8,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoGlyph: {
    color: palette.steel,
    fontSize: 16,
  },
  captainsCta: {
    backgroundColor: palette.surface,
    borderColor: palette.steel,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  captainsCtaText: {
    color: palette.steel,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 6, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  infoCard: {
    width: '100%',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  infoBody: {
    color: palette.textDim,
    fontSize: 14,
    lineHeight: 21,
  },
  infoProgress: {
    color: palette.steel,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
  },
  infoHint: {
    color: palette.textDim,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  infoClose: {
    backgroundColor: palette.steel,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  infoCloseText: {
    color: palette.bg,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  spacer: {
    flex: 1,
  },
  dialogue: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  portrait: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: palette.border,
  },
  speakerMeta: {
    gap: 2,
  },
  speaker: {
    color: palette.steel,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  record: {
    color: palette.textDim,
    fontSize: 12,
  },
  line: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  aside: {
    color: palette.textDim,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
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
});
