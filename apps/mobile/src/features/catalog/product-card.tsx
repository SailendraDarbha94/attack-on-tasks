import { formatPaise, percentOff, type CatalogItem } from '@nukkad/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { Stepper } from '@/components/controls';
import { Text } from '@/components/text';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

/** One soft colour per category, so the grid reads as shelves rather than a wall of white. */
const TINTS = ['#E6F4D7', '#E3EEFB', '#FBF0D0', '#FDE5D2', '#F8E1EC', '#E8E4F9', '#DDF3F1', '#EFEADF', '#FBE3E0'];

export function tintFor(sort: number): string {
  return TINTS[sort % TINTS.length] ?? '#EFEADF';
}

type Props = {
  item: CatalogItem;
  tint: string;
  /** How many are in the cart. */
  qty: number;
  onChange: (qty: number) => void;
};

/** A product in the grid: picture, name, price, and ADD (or the count once it is in the cart). */
export function ProductCard({ item, tint, qty, onChange }: Props) {
  const soldOut = item.maxQty === 0;
  const off = percentOff(item.mrpPaise, item.pricePaise);
  const fewLeft = !soldOut && item.maxQty <= 5;

  return (
    <View style={styles.card}>
      <View style={[styles.tile, { backgroundColor: tint }, soldOut && styles.dimmed]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        {off > 0 && !soldOut && (
          <View style={styles.offer}>
            <Text type="caption" style={styles.offerText}>
              {off}% OFF
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text type="smallBold" numberOfLines={2} style={styles.name}>
          {item.name}
        </Text>
        <Text type="caption" color={fewLeft ? 'warningText' : 'textSecondary'}>
          {fewLeft ? `${item.unitLabel} · only ${item.maxQty} left` : item.unitLabel}
        </Text>
      </View>

      <View style={styles.bottom}>
        <View>
          <Text type="headline">{formatPaise(item.pricePaise)}</Text>
          {off > 0 && (
            <Text type="caption" color="textTertiary" style={styles.strike}>
              {formatPaise(item.mrpPaise)}
            </Text>
          )}
        </View>
        {soldOut ? (
          <Text type="caption" color="textTertiary">
            Sold out
          </Text>
        ) : qty > 0 ? (
          <Stepper solid value={qty} onChange={onChange} label={item.name} max={item.maxQty} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name}`}
            hitSlop={6}
            onPress={() => onChange(1)}
            style={({ pressed }) => [styles.add, pressed && { backgroundColor: Colors.primarySoft }]}>
            <Text type="smallBold" color="primary">
              ADD
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: Spacing.two,
    gap: Spacing.two,
    boxShadow: Shadows.card,
  },
  tile: { height: 104, borderRadius: Radius.field, alignItems: 'center', justifyContent: 'center' },
  dimmed: { opacity: 0.45 },
  emoji: { fontSize: 50, lineHeight: 62 },
  offer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.mango,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderTopLeftRadius: Radius.field,
    borderBottomRightRadius: Radius.small,
  },
  offerText: { color: Colors.onMango, fontWeight: 800, fontSize: 11, lineHeight: 14 },
  body: { paddingHorizontal: Spacing.one, gap: 1 },
  // Two lines' worth, so cards in a row stay the same height.
  name: { minHeight: 38 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.one,
    minHeight: 40,
  },
  strike: { textDecorationLine: 'line-through' },
  add: {
    height: 36,
    minWidth: 68,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small + 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
