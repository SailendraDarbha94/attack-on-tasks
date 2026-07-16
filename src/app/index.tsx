import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing } from '@/constants/theme';
import { leviGreeting } from '@/content/levi';
import { battleStats } from '@/engine/titanMath';
import { useGame } from '@/state/game';

// Landing screen: Captain Levi greets the Scout on every launch,
// his tone tracking how many honest strikes you've landed.
export default function LandingScreen() {
  const { events, hydrated } = useGame();
  const { strikes } = battleStats(events);
  const greeting = leviGreeting(strikes);

  return (
    <ImageBackground
      source={require('../../assets/characters/levi-odm.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.scrim} />
      <SafeAreaView style={styles.screen}>
        <Text style={styles.overline}>SCOUT REGIMENT · SPECIAL OPERATIONS</Text>
        <View style={styles.spacer} />
        <View style={styles.dialogue}>
          <View style={styles.speakerRow}>
            <Image
              source={require('../../assets/characters/levi-portrait.jpg')}
              style={styles.portrait}
            />
            <View style={styles.speakerMeta}>
              <Text style={styles.speaker}>CAPTAIN LEVI</Text>
              <Text style={styles.record}>
                {hydrated ? `${strikes} confirmed strikes` : 'reviewing your record…'}
              </Text>
            </View>
          </View>
          <Text style={styles.line}>“{greeting.line}”</Text>
          <Text style={styles.aside}>“{greeting.aside}”</Text>
        </View>
        <Pressable style={styles.cta} onPress={() => router.replace('/forest')}>
          <Text style={styles.ctaText}>ENTER THE FOREST</Text>
        </Pressable>
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
  overline: {
    color: palette.text,
    fontSize: 12,
    letterSpacing: 3,
    marginTop: spacing.lg,
    textShadowColor: palette.bg,
    textShadowRadius: 8,
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
