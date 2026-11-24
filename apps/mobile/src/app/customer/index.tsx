import { etaMinutes, formatDistance, isActive, type CatalogItem } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, IconButton, SearchField } from '@/components/controls';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { Banner, Button, Empty, ErrorText, Loading, Notice } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { CART_BAR_SPACE, CartBar } from '@/features/cart/cart-bar';
import { cartCount, useCart } from '@/features/cart/store';
import { useCatalog } from '@/features/catalog/api';
import { ProductCard, tintFor } from '@/features/catalog/product-card';
import { useDelivery, useServingStore } from '@/features/delivery/store';
import { useMyOrders } from '@/features/orders/api';
import { CUSTOMER_STATUS } from '@/features/orders/status';
import { friendlyError } from '@/lib/errors';
import { plural } from '@/lib/format';
import { useCurrentLocation } from '@/lib/location';

const COLUMNS = 2;

/** Splits a list into rows of `COLUMNS`, so every card in the grid is the same width. */
function rowsOf<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += COLUMNS) rows.push(items.slice(i, i + COLUMNS));
  return rows;
}

/** The shop: the nearest store's shelves, chosen from where the customer is. */
export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stores, deliverTo, match } = useServingStore();
  const setDeliverTo = useDelivery((state) => state.setDeliverTo);
  const { locate, locating, error: locateError } = useCurrentLocation();

  const store = match?.deliverable ? match.store : undefined;
  const catalog = useCatalog(store?.id);
  const cartStoreId = useCart((state) => state.storeId);
  const cartStoreName = useCart((state) => state.storeName);
  const lines = useCart((state) => state.lines);
  const setQty = useCart((state) => state.setQty);
  const orders = useMyOrders();

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  if (stores.isPending) return <Loading />;
  if (stores.isError || !stores.data) {
    return (
      <Notice title="Can’t load the shop" body={friendlyError(stores.error) ?? 'Please try again.'}>
        <Button label="Try again" onPress={() => void stores.refetch()} />
      </Notice>
    );
  }

  async function useMyLocation() {
    const coords = await locate();
    if (coords) setDeliverTo({ kind: 'gps', label: 'Current location', ...coords });
  }

  const liveOrder = orders.data?.find((order) => isActive(order.status));
  const cartIsHere = store !== undefined && cartStoreId === store.id;
  const qtyOf = (item: CatalogItem) => (cartIsHere ? (lines.find((l) => l.productId === item.productId)?.qty ?? 0) : 0);

  const words = query.trim().toLowerCase();
  const visible = (catalog.data?.items ?? []).filter(
    (item) => (categoryId === null || item.categoryId === categoryId) && (!words || item.name.toLowerCase().includes(words)),
  );
  const sections = (catalog.data?.categories ?? [])
    .map((category) => ({ category, items: visible.filter((item) => item.categoryId === category.id) }))
    .filter((section) => section.items.length > 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five + CART_BAR_SPACE },
        ]}>
        <View style={styles.column}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text type="overline" color="textSecondary">
                {store ? 'Delivery in' : 'Nukkad'}
              </Text>
              <Text type="display">{store && match ? `${etaMinutes(store, match.distanceM)} minutes` : 'Your corner store'}</Text>
            </View>
            <IconButton
              icon="receipt"
              label="Your orders"
              count={orders.data?.filter((order) => isActive(order.status)).length}
              onPress={() => router.push('/customer/orders')}
            />
            <IconButton icon="person" label="Account" onPress={() => router.push('/customer/account')} />
          </View>

          {deliverTo && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delivering to ${deliverTo.label}. Change delivery location`}
              onPress={() => router.push('/customer/location')}
              style={({ pressed }) => [styles.location, pressed && styles.pressed]}>
              <Icon name="pin" size={18} color={Colors.primary} />
              <View style={styles.locationText}>
                <Text type="smallBold" numberOfLines={1}>
                  {deliverTo.label}
                  {deliverTo.area && deliverTo.area !== deliverTo.label ? ` · ${deliverTo.area}` : ''}
                </Text>
                {store && match && (
                  <Text type="caption" color="textSecondary" numberOfLines={1}>
                    From {store.name} · {formatDistance(match.distanceM)} away
                  </Text>
                )}
              </View>
              <Icon name="chevronDown" size={14} color={Colors.textSecondary} />
            </Pressable>
          )}

          {!deliverTo && (
            <Empty emoji="📍" title="Where should we deliver?" body="Nukkad picks the store nearest to you, so you see what is really on its shelf.">
              <View style={styles.actions}>
                <Button label="Use my current location" icon="locate" onPress={useMyLocation} busy={locating} />
                <Button variant="secondary" label="Choose my area" onPress={() => router.push('/customer/location')} />
              </View>
              <ErrorText>{locateError}</ErrorText>
            </Empty>
          )}

          {deliverTo && match && !match.deliverable && (
            <Empty
              emoji="🛵"
              title="We’re not here yet"
              body={`The nearest store, ${match.store.name}, is ${formatDistance(match.distanceM)} away, which is too far to deliver from.`}>
              <Button label="Change delivery location" onPress={() => router.push('/customer/location')} />
            </Empty>
          )}

          {store && (
            <>
              {liveOrder && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/customer/order/${liveOrder.id}`)}
                  style={({ pressed }) => [styles.live, pressed && styles.pressed]}>
                  <Icon name="scooter" size={18} color={Colors.successText} />
                  <Text type="smallBold" style={styles.liveText} numberOfLines={1}>
                    {liveOrder.shortCode} · {CUSTOMER_STATUS[liveOrder.status]}
                  </Text>
                  <Text type="smallBold" color="successText">
                    Track
                  </Text>
                </Pressable>
              )}

              {!store.isOpen && (
                <Banner tone="warning" icon="clock" title={`${store.name} is closed right now`}>
                  You can look around and fill your cart, and order once it opens.
                </Banner>
              )}

              {lines.length > 0 && !cartIsHere && (
                <Banner tone="info" icon="bag">
                  {`You have ${plural(cartCount(lines), 'item')} in a cart from ${cartStoreName}. Adding something here starts a new cart.`}
                </Banner>
              )}

              <SearchField value={query} onChangeText={setQuery} placeholder="Search milk, atta, soap…" />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
                <Chip label="All" selected={categoryId === null} onPress={() => setCategoryId(null)} />
                {(catalog.data?.categories ?? []).map((category) => (
                  <Chip
                    key={category.id}
                    label={`${category.emoji} ${category.name}`}
                    selected={categoryId === category.id}
                    onPress={() => setCategoryId(categoryId === category.id ? null : category.id)}
                  />
                ))}
              </ScrollView>

              <ErrorText>{friendlyError(catalog.error)}</ErrorText>
              {catalog.isPending && <Loading />}

              {catalog.data && sections.length === 0 && (
                <Empty emoji="🔎" title="Nothing matches" body={`No products match “${query.trim()}” in this store.`}>
                  <Button
                    variant="secondary"
                    label="Clear search"
                    onPress={() => {
                      setQuery('');
                      setCategoryId(null);
                    }}
                  />
                </Empty>
              )}

              {sections.map(({ category, items }) => (
                <View key={category.id} style={styles.section}>
                  <Text type="heading">{category.name}</Text>
                  {rowsOf(items).map((row) => (
                    <View key={row[0]?.productId} style={styles.gridRow}>
                      {row.map((item) => (
                        <ProductCard
                          key={item.productId}
                          item={item}
                          tint={tintFor(category.sort)}
                          qty={qtyOf(item)}
                          onChange={(qty) => setQty(store, item, qty)}
                        />
                      ))}
                      {/* Keeps a lone last card at half width instead of stretching it. */}
                      {row.length < COLUMNS && <View style={styles.gridSpacer} />}
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
      {cartIsHere && <CartBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.four, alignItems: 'center' },
  column: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.four },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerText: { flex: 1, gap: Spacing.half },
  pressed: { opacity: 0.6 },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.field,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  locationText: { flex: 1 },
  actions: { alignSelf: 'stretch', gap: Spacing.two, marginTop: Spacing.three },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.field,
    backgroundColor: Colors.successBackground,
  },
  liveText: { flex: 1, color: Colors.successText },
  // Lets the chips run to the screen edge instead of being cut off at the column's padding.
  chipScroll: { marginHorizontal: -Spacing.four, flexGrow: 0 },
  chips: { gap: Spacing.two, paddingHorizontal: Spacing.four },
  section: { gap: Spacing.three, marginTop: Spacing.two },
  gridRow: { flexDirection: 'row', gap: Spacing.three },
  gridSpacer: { flex: 1 },
});
