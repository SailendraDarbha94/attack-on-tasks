import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AsteroidGlyph } from '@/components/AsteroidGlyph';
import { BodyGlyph } from '@/components/BodyGlyph';
import { palette, spacing } from '@/constants/theme';
import { BODIES, bodyForHours } from '@/engine/bodies';
import { useGame } from '@/state/game';

// BodyGlyph clamps at 56pt; the preview asks for the largest it will draw.
const PREVIEW_PT = 56;

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_NAME = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATE_CHIPS = [
  { key: 'today', label: 'TODAY', days: 0 },
  { key: 'tomorrow', label: 'TOMORROW', days: 1 },
  { key: '+2d', label: '+2D', days: 2 },
  { key: '+3d', label: '+3D', days: 3 },
  { key: '+1wk', label: '+1WK', days: 7 },
] as const;

const TIME_CHIPS = [
  { key: 'morning', label: 'MORNING', hour: 9 },
  { key: 'noon', label: 'NOON', hour: 12 },
  { key: 'evening', label: 'EVENING', hour: 18 },
  { key: 'night', label: 'NIGHT', hour: 21 },
] as const;

type TimeKey = (typeof TIME_CHIPS)[number]['key'] | 'custom';

type Mode = 'world' | 'asteroid';

export default function AddScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(modeParam === 'asteroid' ? 'asteroid' : 'world');

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modes}>
          {(
            [
              { key: 'world', label: 'WORLD', gloss: 'recurring' },
              { key: 'asteroid', label: 'ASTEROID', gloss: 'deadline' },
            ] as const
          ).map((option) => {
            const active = option.key === mode;
            return (
              <Pressable
                key={option.key}
                style={[styles.mode, active && styles.modeActive]}
                onPress={() => setMode(option.key)}
              >
                <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                  {option.label}
                </Text>
                <Text style={[styles.modeGloss, active && styles.modeGlossActive]}>
                  {option.gloss}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mode === 'world' ? <WorldForm /> : <AsteroidForm />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function WorldForm() {
  const commissionWorld = useGame((s) => s.commissionWorld);
  const [name, setName] = useState('');
  const [hours, setHours] = useState(24);
  const [saving, setSaving] = useState(false);

  const body = bodyForHours(hours);

  const create = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await commissionWorld(name, hours);
    router.back();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.overline}>COMMISSION A WORLD</Text>
        <Text style={styles.title}>Name the practice, and a world takes it up.</Text>

        <Text style={styles.label}>THE PRACTICE</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Drink water"
          placeholderTextColor={palette.textDim}
          autoFocus
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={create}
        />

        <Text style={styles.label}>ITS PERIOD</Text>
        <View style={styles.periods}>
          {BODIES.map((b) => {
            const active = b.hours === hours;
            return (
              <Pressable
                key={b.id}
                style={[styles.period, active && styles.periodActive]}
                onPress={() => setHours(b.hours)}
              >
                <View style={[styles.dot, { backgroundColor: b.color }]} />
                <View style={styles.periodText}>
                  <Text style={[styles.periodName, active && styles.periodNameActive]}>
                    {b.name.toUpperCase()}
                  </Text>
                  <Text style={[styles.periodCadence, active && styles.periodCadenceActive]}>
                    {b.cadence}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.preview}>
          <BodyGlyph body={body} size={PREVIEW_PT} />
          <View style={styles.previewText}>
            <Text style={styles.previewName}>{body.name}</Text>
            <Text style={styles.previewCaption}>
              {body.orbitYears} Earth years to go around · {body.feature}
            </Text>
          </View>
        </View>

        <Text style={styles.hint}>
          Return it on time and it stays on its ephemeris, gathering light. Light is what your
          star burns the comets down with. An honest “not this pass” costs one pass, nothing
          more.
        </Text>
      </ScrollView>

      <Pressable
        style={[styles.cta, !name.trim() && styles.ctaDisabled]}
        onPress={create}
        disabled={!name.trim() || saving}
      >
        <Text style={styles.ctaText}>SET IT IN ORBIT</Text>
      </Pressable>
      <Pressable style={styles.cancel} onPress={() => router.back()} hitSlop={8}>
        <Text style={styles.cancelText}>Not now</Text>
      </Pressable>
    </>
  );
}

function AsteroidForm() {
  const trackAsteroid = useGame((s) => s.trackAsteroid);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  // Default to the next preset moment that is still ahead of the clock.
  const firstAhead = TIME_CHIPS.find((t) => t.hour > new Date().getHours());
  const [days, setDays] = useState(firstAhead ? 0 : 1);
  const [time, setTime] = useState<TimeKey>(firstAhead?.key ?? 'morning');
  const [customHour, setCustomHour] = useState(12);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hour = time === 'custom' ? customHour : (TIME_CHIPS.find((t) => t.key === time)?.hour ?? 18);
  const dueTs = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
  }, [now, days, hour]);

  const msLeft = dueTs - now;
  const past = msLeft <= 0;
  // closeness, not blame: three days out reads calm, hours out reads hot
  const urgency = past ? 1 : Math.min(1, Math.max(0, 1 - msLeft / (3 * DAY_MS)));

  const create = async () => {
    if (!name.trim() || past || saving) return;
    setSaving(true);
    await trackAsteroid(name, dueTs);
    router.back();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.overline}>TRACK AN ASTEROID</Text>
        <Text style={styles.title}>Name the obligation, and watch the sky.</Text>

        <Text style={styles.label}>THE OBLIGATION</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Renew the passport"
          placeholderTextColor={palette.textDim}
          autoFocus
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={create}
        />

        <Text style={styles.label}>DUE — THE DAY</Text>
        <View style={styles.chips}>
          {DATE_CHIPS.map((chip) => {
            const active = chip.days === days;
            return (
              <Pressable
                key={chip.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setDays(chip.days)}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {chip.label}
                </Text>
                <Text style={[styles.chipSub, active && styles.chipSubActive]}>
                  {chipDate(now, chip.days)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>THE HOUR</Text>
        <View style={styles.chips}>
          {TIME_CHIPS.map((chip) => {
            const active = time === chip.key;
            return (
              <Pressable
                key={chip.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setTime(chip.key)}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {chip.label}
                </Text>
                <Text style={[styles.chipSub, active && styles.chipSubActive]}>
                  {pad(chip.hour)}:00
                </Text>
              </Pressable>
            );
          })}
          <View style={[styles.stepper, time === 'custom' && styles.chipActive]}>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setTime('custom');
                setCustomHour((h) => (h + 23) % 24);
              }}
            >
              <Text style={[styles.stepSign, time === 'custom' && styles.stepSignActive]}>−</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => setTime('custom')}>
              <Text style={[styles.stepHour, time === 'custom' && styles.stepHourActive]}>
                {pad(customHour)}:00
              </Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setTime('custom');
                setCustomHour((h) => (h + 1) % 24);
              }}
            >
              <Text style={[styles.stepSign, time === 'custom' && styles.stepSignActive]}>+</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.impact}>
          Impact window: <Text style={styles.impactStrong}>{formatDue(dueTs)}</Text>
          {past ? '' : ` — in ${formatSpan(msLeft)}`}
        </Text>
        {past ? <Text style={styles.impactPast}>That moment has already passed.</Text> : null}

        <View style={styles.preview}>
          <AsteroidGlyph size={PREVIEW_PT} urgency={urgency} />
          <View style={styles.previewText}>
            <Text style={styles.previewName}>{name.trim() || 'The rock without a name'}</Text>
            <Text style={styles.previewCaption}>
              {past
                ? 'Pick a moment still to come and it will be inbound.'
                : `Inbound from the moment you track it — ${formatSpan(msLeft)} to closest approach.`}
            </Text>
          </View>
        </View>

        <Text style={styles.hint}>
          Deflect it before then and home is safe. If the moment passes, it strikes — the crater
          goes in the record, the record goes on.
        </Text>
      </ScrollView>

      <Pressable
        style={[styles.cta, (!name.trim() || past) && styles.ctaDisabled]}
        onPress={create}
        disabled={!name.trim() || past || saving}
      >
        <Text style={styles.ctaText}>BEGIN TRACKING</Text>
      </Pressable>
      <Pressable style={styles.cancel} onPress={() => router.back()} hitSlop={8}>
        <Text style={styles.cancelText}>Not now</Text>
      </Pressable>
    </>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

function chipDate(now: number, days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return `${DAY_ABBR[d.getDay()]} ${d.getDate()}`;
}

function formatDue(ts: number): string {
  const d = new Date(ts);
  return `${DAY_NAME[d.getDay()]} ${d.getDate()} ${MONTH_NAME[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSpan(ms: number): string {
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const mins = Math.floor((ms % HOUR_MS) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${Math.max(mins, 1)}m`;
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
  modes: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  mode: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  modeActive: {
    backgroundColor: palette.ice,
    borderColor: palette.ice,
  },
  modeLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modeLabelActive: {
    color: palette.bg,
  },
  modeGloss: {
    color: palette.textDim,
    fontSize: 10,
    marginTop: 1,
  },
  modeGlossActive: {
    color: palette.bg,
    opacity: 0.75,
  },
  scroll: {
    paddingBottom: spacing.lg,
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
    color: palette.ice,
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
  periods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  period: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  periodActive: {
    backgroundColor: palette.ice,
    borderColor: palette.ice,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  periodText: {
    flexShrink: 1,
  },
  periodName: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  periodNameActive: {
    color: palette.bg,
  },
  periodCadence: {
    color: palette.textDim,
    fontSize: 11,
    marginTop: 1,
  },
  periodCadenceActive: {
    color: palette.bg,
    opacity: 0.75,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexGrow: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  chipActive: {
    backgroundColor: palette.ice,
    borderColor: palette.ice,
  },
  chipLabel: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chipLabelActive: {
    color: palette.bg,
  },
  chipSub: {
    color: palette.textDim,
    fontSize: 10,
    marginTop: 1,
  },
  chipSubActive: {
    color: palette.bg,
    opacity: 0.75,
  },
  stepper: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  stepSign: {
    color: palette.ice,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  stepSignActive: {
    color: palette.bg,
  },
  stepHour: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stepHourActive: {
    color: palette.bg,
  },
  impact: {
    color: palette.textDim,
    fontSize: 13,
    marginTop: spacing.md,
  },
  impactStrong: {
    color: palette.text,
    fontWeight: '700',
  },
  impactPast: {
    color: palette.textDim,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  previewText: {
    flexShrink: 1,
  },
  previewName: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
  },
  previewCaption: {
    color: palette.textDim,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
  hint: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.lg,
  },
  cta: {
    backgroundColor: palette.ice,
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
