import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

/** Small controls: chips, badges, steppers, round buttons and the search field. */

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : null,
        pressed && styles.pressed,
      ]}>
      <Text type="smallBold" style={{ color: selected ? Colors.onInk : Colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function Badge({ label, tone, dot }: { label: string; tone: BadgeTone; dot?: boolean }) {
  const [background, color] =
    tone === 'neutral'
      ? [Colors.element, Colors.textSecondary]
      : [Colors[`${tone}Background`], Colors[`${tone}Text`]];
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text type="caption" style={{ color, fontWeight: 700 }}>
        {label}
      </Text>
    </View>
  );
}

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** What one unit is, for screen readers: "Tomato". */
  label: string;
  min?: number;
  max?: number;
  /** The filled tomato version that replaces ADD on a product. */
  solid?: boolean;
};

export function Stepper({ value, onChange, label, min = 0, max = Infinity, solid }: StepperProps) {
  const canRemove = value > min;
  const canAdd = value < max;
  const foreground = solid ? Colors.onPrimary : Colors.text;
  return (
    <View style={[styles.stepper, solid ? styles.stepperSolid : styles.stepperPlain]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove one ${label}`}
        accessibilityState={{ disabled: !canRemove }}
        disabled={!canRemove}
        hitSlop={6}
        onPress={() => onChange(value - 1)}
        style={({ pressed }) => [styles.step, pressed && styles.pressed]}>
        <Icon name="minus" size={15} color={foreground} weight="bold" style={!canRemove ? styles.faded : undefined} />
      </Pressable>
      <Text type="smallBold" style={[styles.qty, { color: foreground }]} accessibilityLabel={`${value} ${label}`}>
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add one ${label}`}
        accessibilityState={{ disabled: !canAdd }}
        disabled={!canAdd}
        hitSlop={6}
        onPress={() => onChange(value + 1)}
        style={({ pressed }) => [styles.step, pressed && styles.pressed]}>
        <Icon name="plus" size={15} color={foreground} weight="bold" style={!canAdd ? styles.faded : undefined} />
      </Pressable>
    </View>
  );
}

type IconButtonProps = {
  icon: IconName;
  /** Read out by screen readers; the button shows no text. */
  label: string;
  onPress: () => void;
  size?: number;
  /** A small count on the corner, hidden at zero. */
  count?: number;
};

export function IconButton({ icon, label, onPress, size = 42, count = 0 }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `${label}, ${count}` : label}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && { backgroundColor: Colors.elementStrong },
      ]}>
      <Icon name={icon} size={20} color={Colors.text} />
      {count > 0 && (
        <View style={styles.count}>
          <Text type="caption" style={styles.countText}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchField({ value, onChangeText, placeholder, style }: SearchFieldProps) {
  return (
    <View style={[styles.search, style]}>
      <Icon name="search" size={18} color={Colors.textSecondary} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        value={value}
        onChangeText={onChangeText}
        style={styles.searchInput}
      />
      {value.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => onChangeText('')}>
          <Icon name="close" size={16} color={Colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

/** A tappable row with a title, a line under it, and something on the right. */
export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  selected,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={selected === undefined ? undefined : { selected }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, selected && styles.listRowSelected, pressed && styles.pressed]}>
      {icon && (
        <View style={styles.listIcon}>
          <Icon name={icon} size={18} color={Colors.text} />
        </View>
      )}
      <View style={styles.listText}>
        <Text type="headline">{title}</Text>
        {subtitle && (
          <Text type="small" color="textSecondary">
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (onPress && selected === undefined ? <Icon name="chevronRight" size={16} color={Colors.textTertiary} /> : null)}
      {selected && <Icon name="check" size={18} color={Colors.primary} weight="bold" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  faded: { opacity: 0.35 },
  chip: {
    height: 38,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 36, borderRadius: Radius.small + 2 },
  stepperSolid: { backgroundColor: Colors.primary },
  stepperPlain: { backgroundColor: Colors.element },
  step: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 20, textAlign: 'center', fontVariant: ['tabular-nums'] },
  iconButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.element },
  count: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: Colors.onPrimary, fontSize: 11, lineHeight: 14, fontWeight: 700 },
  search: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.field,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text, height: 46, outlineWidth: 0 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.field,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  listRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  listIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.element,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listText: { flex: 1, gap: 1 },
});
