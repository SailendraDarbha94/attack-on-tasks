import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import { Colors, MaxContentWidth, Radius, Shadows, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  /** Pinned under the scrolling content: a total and its button. */
  footer?: ReactNode;
  /** The screen has no navigation bar, so the content must clear the status bar itself. */
  noHeader?: boolean;
  /** Extra space at the bottom, for a floating bar that covers the content. */
  bottomInset?: number;
};

/** A scrolling page: one centred column, clear of the notch and the home indicator. */
export function Screen({ children, footer, noHeader, bottomInset = 0 }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView
        // With a navigation bar, iOS insets the content under it by itself.
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (noHeader ? insets.top : 0) + Spacing.four,
            paddingBottom: (footer ? 0 : insets.bottom) + Spacing.five + bottomInset,
          },
        ]}>
        <View style={styles.column}>{children}</View>
      </ScrollView>
      {footer && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.column}>{footer}</View>
        </View>
      )}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Two things on one line, pushed to opposite ends. */
export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  icon?: IconName;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, busy, style }: ButtonProps) {
  const off = disabled || busy;
  const foreground =
    variant === 'primary'
      ? Colors.onPrimary
      : variant === 'danger'
        ? Colors.dangerText
        : variant === 'text'
          ? Colors.primary
          : Colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: pressed ? Colors.primaryPressed : Colors.primary },
        variant === 'secondary' && { backgroundColor: pressed ? Colors.elementStrong : Colors.element },
        variant === 'danger' && { backgroundColor: Colors.dangerBackground, opacity: pressed ? 0.7 : 1 },
        variant === 'text' && [styles.textButton, pressed && styles.pressed],
        off && styles.disabled,
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={foreground} />}
          <Text type="headline" style={{ color: foreground }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/** A labelled text field. `hint` sits under it; `error` replaces the hint in red. */
export function Field({
  label,
  hint,
  error,
  style,
  ...input
}: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  return (
    <View style={styles.field}>
      <Text type="smallBold">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Colors.textTertiary}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...input}
      />
      {(error || hint) && (
        <Text type="caption" color={error ? 'dangerText' : 'textSecondary'}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

/** A message in a tinted box: something went wrong, or something to know before going on. */
export function Banner({
  tone,
  title,
  children,
  icon,
}: {
  tone: 'danger' | 'warning' | 'info' | 'success';
  title?: string;
  children?: ReactNode;
  icon?: IconName;
}) {
  const color = Colors[`${tone}Text`];
  return (
    <View style={[styles.banner, { backgroundColor: Colors[`${tone}Background`] }]} accessibilityRole="alert">
      {icon && <Icon name={icon} size={18} color={color} style={styles.bannerIcon} />}
      <View style={styles.bannerText}>
        {title && (
          <Text type="smallBold" style={{ color }}>
            {title}
          </Text>
        )}
        {typeof children === 'string' ? (
          <Text type="small" style={{ color }}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

/** Shows nothing when there is no message, so it can sit in a layout unconditionally. */
export function ErrorText({ children }: { children: string | null | undefined }) {
  if (!children) return null;
  return (
    <Banner tone="danger" icon="warning">
      {children}
    </Banner>
  );
}

export function Loading() {
  return (
    <View style={styles.centre}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}

/** What a list says when it has nothing in it. */
export function Empty({ emoji, title, body, children }: { emoji: string; title: string; body: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text type="heading" style={styles.centredText}>
        {title}
      </Text>
      <Text type="small" color="textSecondary" style={styles.centredText}>
        {body}
      </Text>
      {children}
    </View>
  );
}

/** A full-screen message with optional actions underneath. */
export function Notice({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, styles.notice, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.column, styles.noticeColumn]}>
        <Text type="title">{title}</Text>
        <Text color="textSecondary">{body}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.four, alignItems: 'center' },
  column: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.four },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.line,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.three,
    boxShadow: Shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  button: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.field,
  },
  textButton: { minHeight: 40, paddingHorizontal: Spacing.two },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.45 },
  field: { gap: Spacing.one + 2 },
  input: {
    minHeight: 50,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.field,
  },
  inputError: { borderColor: Colors.dangerText },
  banner: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.field },
  bannerIcon: { marginTop: 1 },
  bannerText: { flex: 1, gap: Spacing.half },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.six, backgroundColor: Colors.background },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.seven, paddingHorizontal: Spacing.five },
  emptyEmoji: { fontSize: 44, lineHeight: 56 },
  centredText: { textAlign: 'center' },
  notice: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.five },
  noticeColumn: { gap: Spacing.three },
});
