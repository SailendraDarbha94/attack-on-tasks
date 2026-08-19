import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing } from '@/constants/theme';
import { COMETS } from '@/content/comets';
import { HABITS } from '@/engine/system';
import { useGame } from '@/state/game';

const CADENCES = [2, 3, 4, 6];

export default function SettingsScreen() {
  const { settings, updateSettings } = useGame();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topRow}>
        <Text style={styles.overline}>INSTRUMENTS & HOURS</Text>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={styles.done}>DONE</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Observe every</Text>
      <View style={styles.chips}>
        {CADENCES.map((h) => (
          <Pressable
            key={h}
            style={[styles.chip, settings.cadenceHours === h && styles.chipActive]}
            onPress={() => updateSettings({ cadenceHours: h })}
          >
            <Text
              style={[styles.chipText, settings.cadenceHours === h && styles.chipTextActive]}
            >
              {h}h
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Observing hours</Text>
      <View style={styles.row}>
        <Stepper
          label="from"
          value={settings.dayStartHour}
          onChange={(v) => updateSettings({ dayStartHour: v })}
        />
        <Stepper
          label="until"
          value={settings.dayEndHour}
          onChange={(v) => updateSettings({ dayEndHour: v })}
        />
      </View>
      <Text style={styles.hint}>Windows only open during observing hours.</Text>

      <Text style={styles.sectionTitle}>Comets tracked</Text>
      {HABITS.map((habit) => (
        <View key={habit} style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{COMETS[habit].name}</Text>
          <Switch
            value={settings.habitsEnabled[habit]}
            onValueChange={(on) => updateSettings({ habitsEnabled: { [habit]: on } })}
            trackColor={{ true: palette.ice, false: palette.raised }}
            thumbColor={palette.text}
          />
        </View>
      ))}
      <Text style={styles.hint}>
        Untracking a comet closes its windows — it neither brightens nor thins.
      </Text>
    </SafeAreaView>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable hitSlop={8} style={styles.stepBtn} onPress={() => onChange(value - 1)}>
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{String(value).padStart(2, '0')}:00</Text>
        <Pressable hitSlop={8} style={styles.stepBtn} onPress={() => onChange(value + 1)}>
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  overline: {
    color: palette.textDim,
    fontSize: 12,
    letterSpacing: 3,
  },
  done: {
    color: palette.ice,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.xl,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: palette.ice,
    borderColor: palette.ice,
  },
  chipText: {
    color: palette.textDim,
    fontWeight: '700',
  },
  chipTextActive: {
    color: palette.bg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stepper: {
    flex: 1,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepperLabel: {
    color: palette.textDim,
    fontSize: 12,
    letterSpacing: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: palette.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: palette.ice,
    fontSize: 18,
    fontWeight: '700',
  },
  stepValue: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  toggleLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: palette.textDim,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
});
