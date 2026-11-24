import { LOW_STOCK_AT, formatPaise, type InventoryItem } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Chip, SearchField } from '@/components/controls';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { Button, Empty, ErrorText, Loading, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useInventory } from '@/features/desk/api';
import { friendlyError } from '@/lib/errors';

type Filter = 'all' | 'low' | 'hidden';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'low', label: 'Running low' },
  { id: 'hidden', label: 'Hidden' },
];

function stockLine(item: InventoryItem): { text: string; color: 'dangerText' | 'warningText' | 'textSecondary' } {
  if (item.stock === 0) return { text: 'Out of stock', color: 'dangerText' };
  if (item.stock <= LOW_STOCK_AT) return { text: `Only ${item.stock} left`, color: 'warningText' };
  return { text: `${item.stock} in stock`, color: 'textSecondary' };
}

/** Everything on the store's shelf. Tap a product to change its price or stock. */
export default function InventoryScreen() {
  const router = useRouter();
  const inventory = useInventory();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  if (inventory.isPending) return <Loading />;

  const words = query.trim().toLowerCase();
  const visible = (inventory.data?.items ?? []).filter(
    (item) =>
      (!words || item.name.toLowerCase().includes(words)) &&
      (filter === 'all' || (filter === 'low' ? item.isAvailable && item.stock <= LOW_STOCK_AT : !item.isAvailable)),
  );
  const sections = (inventory.data?.categories ?? [])
    .map((category) => ({ category, items: visible.filter((item) => item.categoryId === category.id) }))
    .filter((section) => section.items.length > 0);

  return (
    <Screen>
      <ErrorText>{friendlyError(inventory.error)}</ErrorText>
      <Button variant="secondary" icon="plus" label="Add products from the catalogue" onPress={() => router.push('/store/add')} />
      <SearchField value={query} onChangeText={setQuery} placeholder="Search your shelf" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
        {FILTERS.map((option) => (
          <Chip key={option.id} label={option.label} selected={filter === option.id} onPress={() => setFilter(option.id)} />
        ))}
      </ScrollView>

      {sections.length === 0 && <Empty emoji="📦" title="Nothing here" body="No products match this search or filter." />}

      {sections.map(({ category, items }) => (
        <View key={category.id} style={styles.section}>
          <Text type="overline" color="textSecondary">
            {category.name}
          </Text>
          <View style={styles.list}>
            {items.map((item, index) => {
              const stock = stockLine(item);
              return (
                <Pressable
                  key={item.productId}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.unitLabel}, ${formatPaise(item.pricePaise)}, ${stock.text}`}
                  onPress={() => router.push(`/store/item/${item.productId}`)}
                  style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && styles.pressed]}>
                  <Text style={[styles.emoji, !item.isAvailable && styles.faded]}>{item.emoji}</Text>
                  <View style={styles.rowText}>
                    <Text type="smallBold" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text type="caption" color={stock.color}>
                      {item.unitLabel} · {stock.text}
                    </Text>
                  </View>
                  {!item.isAvailable && <Badge label="Hidden" tone="neutral" />}
                  <Text type="smallBold">{formatPaise(item.pricePaise)}</Text>
                  <Icon name="chevronRight" size={14} color={Colors.textTertiary} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipScroll: { marginHorizontal: -Spacing.four, flexGrow: 0 },
  chips: { gap: Spacing.two, paddingHorizontal: Spacing.four },
  section: { gap: Spacing.two },
  list: { backgroundColor: Colors.surface, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.line },
  pressed: { opacity: 0.6 },
  emoji: { fontSize: 26, lineHeight: 32, width: 34, textAlign: 'center' },
  faded: { opacity: 0.4 },
  rowText: { flex: 1, gap: 1 },
});
