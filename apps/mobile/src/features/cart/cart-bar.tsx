import { formatPaise } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { Colors, MaxContentWidth, Radius, Shadows, Spacing } from '@/constants/theme';
import { plural } from '@/lib/format';

import { cartCount, cartSubtotal, useCart } from './store';

/** How much room a screen should leave at the bottom so the bar covers nothing. */
export const CART_BAR_SPACE = 84;

/** The floating bar that follows the customer round the store once the cart has something in it. */
export function CartBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lines = useCart((state) => state.lines);
  if (lines.length === 0) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + Spacing.three }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View cart, ${plural(cartCount(lines), 'item')}, ${formatPaise(cartSubtotal(lines))}`}
        onPress={() => router.push('/customer/cart')}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}>
        <View style={styles.bag}>
          <Icon name="bag" size={18} color={Colors.onInk} />
        </View>
        <View style={styles.text}>
          <Text type="headline" style={styles.light}>
            {formatPaise(cartSubtotal(lines))}
          </Text>
          <Text type="caption" style={styles.dim}>
            {plural(cartCount(lines), 'item')}
          </Text>
        </View>
        <Text type="headline" style={styles.light}>
          View cart
        </Text>
        <Icon name="chevronRight" size={14} color={Colors.onInk} weight="bold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: Spacing.four },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingRight: Spacing.four,
    borderRadius: Radius.card,
    backgroundColor: Colors.ink,
    boxShadow: Shadows.floating,
  },
  pressed: { opacity: 0.9 },
  bag: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  light: { color: Colors.onInk },
  dim: { color: 'rgba(255, 255, 255, 0.7)' },
});
