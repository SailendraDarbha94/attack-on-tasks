import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing } from '@/constants/theme';
import { useGame } from '@/state/game';

const CADENCES = [
  { label: '2× DAY', hours: 12 },
  { label: 'DAILY', hours: 24 },
  { label: '2 DAYS', hours: 48 },
  { label: '3 DAYS', hours: 72 },
  { label: 'WEEKLY', hours: 168 },
];

export default function AddTitanScreen() {
  const addChore = useGame((s) => s.addChore);
  const [name, setName] = useState('');
  const [hours, setHours] = useState(24);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await addChore(name, hours);
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.overline}>SUMMON A LESSER TITAN</Text>
        <Text style={styles.title}>Name the work, and it takes a body.</Text>

        <Text style={styles.label}>THE TASK</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Fold the laundry"
          placeholderTextColor={palette.textDim}
          autoFocus
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={create}
        />

        <Text style={styles.label}>IT RETURNS</Text>
        <View style={styles.cadences}>
          {CADENCES.map((c) => (
            <Pressable
              key={c.hours}
              style={[styles.cadence, hours === c.hours && styles.cadenceActive]}
              onPress={() => setHours(c.hours)}
            >
              <Text
                style={[styles.cadenceText, hours === c.hours && styles.cadenceTextActive]}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.hint}>
          It roams the clearing when due. Kill it by doing the work — every kill sharpens your
          blades against the bosses. An honest “not today” sends it away until tomorrow, no
          penalty.
        </Text>

        <View style={styles.spacer} />
        <Pressable
          style={[styles.cta, !name.trim() && styles.ctaDisabled]}
          onPress={create}
          disabled={!name.trim() || saving}
        >
          <Text style={styles.ctaText}>LET IT WALK</Text>
        </Pressable>
        <Pressable style={styles.cancel} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.cancelText}>Not now</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  overline: {
    color: palette.textDim,
    fontSize: 12,
    letterSpacing: 3,
    marginTop: spacing.lg,
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  label: {
    color: palette.steel,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: palette.text,
    fontSize: 16,
  },
  cadences: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cadence: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cadenceActive: {
    backgroundColor: palette.steel,
    borderColor: palette.steel,
  },
  cadenceText: {
    color: palette.textDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cadenceTextActive: {
    color: palette.bg,
  },
  hint: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  cta: {
    backgroundColor: palette.steel,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    color: palette.bg,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    color: palette.textDim,
    fontSize: 13,
  },
});
