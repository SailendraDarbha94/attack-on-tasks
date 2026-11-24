import { APP_ROLES, type AppRole } from '@nukkad/core';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { Colors, MaxContentWidth, Radius, Shadows, Spacing } from '@/constants/theme';
import { useSession } from '@/lib/session';

const ROLE_COPY: Record<AppRole, { emoji: string; tint: string; title: string; blurb: string }> = {
  customer: {
    emoji: '🛒',
    tint: '#E6F4D7',
    title: 'I want to order',
    blurb: 'Groceries from the store nearest to you, at your door in minutes.',
  },
  store: {
    emoji: '🏪',
    tint: '#FBF0D0',
    title: 'I run a store',
    blurb: 'Take orders as they come in and keep your shelf up to date.',
  },
};

/** First-launch screen. The root layout only shows it while no role is chosen. */
export default function RoleSelectScreen() {
  const { chooseRole } = useSession();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Centred while everything fits; scrolls on small screens or with larger text. */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
          <View style={styles.heading}>
            <Text type="display">Welcome to Nukkad</Text>
            <Text color="textSecondary">Your corner store, delivered. How will you use the app?</Text>
          </View>

          {APP_ROLES.map((role) => (
            <Pressable
              key={role}
              accessibilityRole="button"
              onPress={() => chooseRole(role)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={[styles.tile, { backgroundColor: ROLE_COPY[role].tint }]}>
                <Text style={styles.emoji}>{ROLE_COPY[role].emoji}</Text>
              </View>
              <View style={styles.cardText}>
                <Text type="headline">{ROLE_COPY[role].title}</Text>
                <Text type="small" color="textSecondary">
                  {ROLE_COPY[role].blurb}
                </Text>
              </View>
              <Icon name="chevronRight" size={16} color={Colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.five },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.four },
  logo: { width: 68, height: 68, borderRadius: 16 },
  heading: { gap: Spacing.two, marginBottom: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.card,
    backgroundColor: Colors.surface,
    boxShadow: Shadows.card,
  },
  pressed: { opacity: 0.7 },
  tile: { width: 64, height: 64, borderRadius: Radius.field, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 32, lineHeight: 40 },
  cardText: { flex: 1, gap: Spacing.half },
});
