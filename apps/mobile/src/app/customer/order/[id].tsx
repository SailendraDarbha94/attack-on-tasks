import { canTransition, isActive, type Order } from '@nukkad/core';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/controls';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { Banner, Button, Card, ErrorText, Loading, Screen } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { useCancelOrder, useOrder } from '@/features/orders/api';
import { OrderSummary } from '@/features/orders/order-summary';
import { CUSTOMER_STATUS, TIMELINE } from '@/features/orders/status';
import { friendlyError } from '@/lib/errors';
import { formatTime, formatWhen } from '@/lib/format';

/** What to expect next, in a sentence. */
function nextStep(order: Order): string {
  switch (order.status) {
    case 'placed':
      return `${order.store.name} has your order and will confirm it shortly.`;
    case 'accepted':
      return 'The store is packing your order now.';
    case 'ready':
      return 'Packed and waiting to leave the store.';
    case 'out_for_delivery':
      return 'Your order has left the store. Keep your phone nearby.';
    case 'delivered':
      return 'Enjoy! Thanks for ordering from Nukkad.';
    case 'rejected':
      return order.cancelReason ? `The store could not take this order: ${order.cancelReason}` : 'The store could not take this order.';
    case 'cancelled':
      return 'This order was cancelled. Nothing is due.';
  }
}

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id);
  const cancel = useCancelOrder();
  const [confirming, setConfirming] = useState(false);

  if (order.isPending) return <Loading />;
  if (!order.data) {
    return (
      <Screen>
        <ErrorText>{friendlyError(order.error) ?? 'That order could not be found.'}</ErrorText>
      </Screen>
    );
  }

  const data = order.data;
  const reached = TIMELINE.findIndex((step) => step.status === data.status);
  const stopped = data.status === 'rejected' || data.status === 'cancelled';

  return (
    <Screen>
      <View style={styles.hero}>
        <Badge label={data.shortCode} tone="neutral" />
        <Text type="title">{CUSTOMER_STATUS[data.status]}</Text>
        <Text color="textSecondary">{nextStep(data)}</Text>
      </View>

      {!stopped && (
        <Card>
          {TIMELINE.map((step, index) => {
            const done = index <= reached;
            const stamp = data[step.stamp];
            return (
              <View key={step.status} style={styles.step}>
                <View style={styles.rail}>
                  <View style={[styles.marker, done && styles.markerDone]}>
                    {done && <Icon name="check" size={11} color={Colors.onPrimary} weight="bold" />}
                  </View>
                  {index < TIMELINE.length - 1 && <View style={[styles.connector, index < reached && styles.connectorDone]} />}
                </View>
                <View style={styles.stepText}>
                  <Text type={index === reached ? 'headline' : 'small'} color={done ? 'text' : 'textTertiary'}>
                    {step.label}
                  </Text>
                  {stamp && (
                    <Text type="caption" color="textSecondary">
                      {formatTime(stamp)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {stopped && (
        <Banner tone={data.status === 'rejected' ? 'danger' : 'info'} title={CUSTOMER_STATUS[data.status]}>
          {data.cancelledAt ? formatWhen(data.cancelledAt) : ''}
        </Banner>
      )}

      <Card>
        <Text type="overline" color="textSecondary">
          From {data.store.name} · {formatWhen(data.placedAt)}
        </Text>
        <OrderSummary order={data} />
      </Card>

      <ErrorText>{friendlyError(cancel.error)}</ErrorText>

      {isActive(data.status) && (
        <Button
          variant="secondary"
          icon="phone"
          label={`Call ${data.store.name}`}
          onPress={() => void Linking.openURL(`tel:${data.store.phone.replace(/\s/g, '')}`)}
        />
      )}

      {canTransition(data.status, 'cancelled', 'customer') && (
        <Button
          variant="danger"
          label={confirming ? 'Tap again to cancel this order' : 'Cancel order'}
          busy={cancel.isPending}
          onPress={() => (confirming ? cancel.mutate(data.id) : setConfirming(true))}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.two },
  step: { flexDirection: 'row', gap: Spacing.three, minHeight: 46 },
  rail: { alignItems: 'center', width: 22 },
  marker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.line,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  connector: { flex: 1, width: 2, backgroundColor: Colors.line, marginVertical: 2 },
  connectorDone: { backgroundColor: Colors.primary },
  stepText: { flex: 1, paddingBottom: Spacing.three },
});
