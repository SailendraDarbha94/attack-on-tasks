import {
  MAX_QTY_PER_ITEM,
  PAYMENT_METHODS,
  deliveryFeePaise,
  formatPaise,
  matchStore,
  type PaymentMethod,
} from '@nukkad/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListRow, Stepper } from '@/components/controls';
import { Text } from '@/components/text';
import { Banner, Button, Card, Empty, ErrorText, Field, Loading, Row, Screen } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { addressLine, useAddresses } from '@/features/addresses/api';
import { useCart } from '@/features/cart/store';
import { useCatalog } from '@/features/catalog/api';
import { useDelivery, useStores } from '@/features/delivery/store';
import { usePlaceOrder } from '@/features/orders/api';
import { PAYMENT_LABEL } from '@/features/orders/status';
import { friendlyError } from '@/lib/errors';

/** The cart and the checkout in one screen: what, where to, how to pay, and the button. */
export default function CartScreen() {
  const router = useRouter();
  const { storeId, lines, idempotencyKey, setQty, clear } = useCart();
  const stores = useStores();
  const catalog = useCatalog(storeId ?? undefined);
  const addresses = useAddresses();
  const addressId = useDelivery((state) => state.addressId);
  const place = usePlaceOrder();
  const [payment, setPayment] = useState<PaymentMethod>('upi');
  const [notes, setNotes] = useState('');

  if (lines.length === 0) {
    return (
      <Screen>
        <Empty emoji="🧺" title="Your cart is empty" body="Add a few things from the shop and they will show up here.">
          <Button label="Go to the shop" onPress={() => router.back()} />
        </Empty>
      </Screen>
    );
  }

  const store = stores.data?.find((candidate) => candidate.id === storeId);
  if (!store) return <Loading />;

  // Show today's price and stock, not what they were when the item was added.
  const shelf = new Map((catalog.data?.items ?? []).map((item) => [item.productId, item]));
  const rows = lines.map((line) => {
    const fresh = shelf.get(line.productId);
    const maxQty = catalog.data ? (fresh?.maxQty ?? 0) : MAX_QTY_PER_ITEM;
    return { line, maxQty, pricePaise: fresh?.pricePaise ?? line.pricePaise, short: line.qty > maxQty };
  });
  const subtotal = rows.reduce((sum, row) => sum + row.pricePaise * row.line.qty, 0);
  const fee = deliveryFeePaise(store, subtotal);
  const toFree = store.freeDeliveryAbovePaise === null ? 0 : store.freeDeliveryAbovePaise - subtotal;

  // The chosen address, or failing that the first saved one this store can reach.
  const saved = addresses.data ?? [];
  const reachable = (id: string) => {
    const found = saved.find((a) => a.id === id);
    return found ? matchStore(store, found).deliverable : false;
  };
  const address = saved.find((a) => a.id === addressId) ?? saved.find((a) => reachable(a.id));
  const addressOk = address ? reachable(address.id) : false;

  const blocker = !store.isOpen
    ? `${store.name} is closed right now. Your cart will be here when it opens.`
    : rows.some((row) => row.short)
      ? 'Some items have sold out or run low. Fix the lines marked below to continue.'
      : subtotal < store.minOrderPaise
        ? `The minimum order is ${formatPaise(store.minOrderPaise)}. Add ${formatPaise(store.minOrderPaise - subtotal)} more.`
        : null;

  function placeOrder() {
    if (!address || !store) return;
    place.mutate(
      {
        storeId: store.id,
        addressId: address.id,
        items: lines.map((line) => ({ productId: line.productId, qty: line.qty })),
        paymentMethod: payment,
        notes: notes.trim() || undefined,
        idempotencyKey,
      },
      {
        onSuccess: (order) => {
          clear();
          router.replace(`/customer/order/${order.id}`);
        },
        // Most refusals mean the shelf changed under us, so look again.
        onError: () => void catalog.refetch(),
      },
    );
  }

  return (
    <Screen
      footer={
        <>
          <ErrorText>{friendlyError(place.error)}</ErrorText>
          <Row>
            <View>
              <Text type="heading">{formatPaise(subtotal + fee)}</Text>
              <Text type="caption" color="textSecondary">
                {PAYMENT_LABEL[payment]}
              </Text>
            </View>
            <Button
              label="Place order"
              onPress={placeOrder}
              busy={place.isPending}
              disabled={blocker !== null || !address || !addressOk}
              style={styles.placeButton}
            />
          </Row>
        </>
      }>
      {blocker && (
        <Banner tone="warning" icon="warning">
          {blocker}
        </Banner>
      )}

      <Card>
        <Text type="overline" color="textSecondary">
          From {store.name}
        </Text>
        {rows.map(({ line, maxQty, pricePaise, short }) => (
          <View key={line.productId} style={styles.line}>
            <View style={styles.tile}>
              <Text style={styles.emoji}>{line.emoji}</Text>
            </View>
            <View style={styles.lineText}>
              <Text type="smallBold" numberOfLines={2}>
                {line.name}
              </Text>
              <Text type="caption" color={short ? 'dangerText' : 'textSecondary'}>
                {short ? (maxQty === 0 ? 'Sold out. Remove it to continue.' : `Only ${maxQty} left`) : `${line.unitLabel} · ${formatPaise(pricePaise)}`}
              </Text>
            </View>
            <View style={styles.lineEnd}>
              <Stepper
                value={line.qty}
                label={line.name}
                // Still lets a sold-out line be taken down to zero.
                max={Math.max(maxQty, line.qty)}
                onChange={(qty) => setQty(store, { ...line, pricePaise }, qty)}
              />
              <Text type="smallBold">{formatPaise(pricePaise * line.qty)}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Row>
          <Text type="small" color="textSecondary">
            Item total
          </Text>
          <Text type="small">{formatPaise(subtotal)}</Text>
        </Row>
        <Row>
          <Text type="small" color="textSecondary">
            Delivery
          </Text>
          <Text type="small" color={fee === 0 ? 'successText' : 'text'}>
            {fee === 0 ? 'Free' : formatPaise(fee)}
          </Text>
        </Row>
        {fee > 0 && toFree > 0 && (
          <Text type="caption" color="successText">
            Add {formatPaise(toFree)} more for free delivery.
          </Text>
        )}
        <View style={styles.rule} />
        <Row>
          <Text type="headline">To pay</Text>
          <Text type="headline">{formatPaise(subtotal + fee)}</Text>
        </Row>
      </Card>

      <View style={styles.group}>
        <Text type="heading">Deliver to</Text>
        {address ? (
          <ListRow
            icon={address.label === 'Work' ? 'work' : 'home'}
            title={address.label}
            subtitle={`${addressLine(address)}, ${address.pincode}`}
            right={
              <Text type="smallBold" color="primary">
                Change
              </Text>
            }
            onPress={() => router.push('/customer/addresses')}
          />
        ) : (
          <Button
            variant="secondary"
            icon="plus"
            label={saved.length > 0 ? 'Choose a delivery address' : 'Add a delivery address'}
            onPress={() => router.push(saved.length > 0 ? '/customer/addresses' : '/customer/address-new')}
          />
        )}
        {address && !addressOk && (
          <Banner tone="danger" icon="warning">
            {`This address is outside ${store.name}’s delivery area. Choose another address, or change your delivery location to shop from the store near it.`}
          </Banner>
        )}
      </View>

      <View style={styles.group}>
        <Text type="heading">Pay on delivery</Text>
        {PAYMENT_METHODS.map((method) => (
          <ListRow
            key={method}
            icon={method}
            title={PAYMENT_LABEL[method]}
            subtitle={method === 'upi' ? 'Scan the code when your order arrives.' : 'Keep change ready if you can.'}
            selected={payment === method}
            onPress={() => setPayment(method)}
          />
        ))}
      </View>

      <Field
        label="Delivery instructions (optional)"
        placeholder="Ring the bell, leave at the gate…"
        maxLength={200}
        value={notes}
        onChangeText={setNotes}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  tile: {
    width: 48,
    height: 48,
    borderRadius: Radius.small + 4,
    backgroundColor: Colors.element,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26, lineHeight: 32 },
  lineText: { flex: 1, gap: 1 },
  lineEnd: { alignItems: 'flex-end', gap: Spacing.one },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.line },
  placeButton: { minWidth: 170 },
});
