import { formatPaise } from '@nukkad/core';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/controls';
import { Text } from '@/components/text';
import { Card, Empty, ErrorText, Loading, Row, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStoreOrders } from '@/features/orders/api';
import { STATUS_TONE, STORE_STATUS } from '@/features/orders/status';
import { StoreOrderCard } from '@/features/orders/store-order-card';
import { friendlyError } from '@/lib/errors';
import { formatWhen } from '@/lib/format';

export default function StoreOrdersScreen() {
  const active = useStoreOrders('active');
  const finished = useStoreOrders('finished');

  if (active.isPending) return <Loading />;

  // New orders first: they are the ones waiting on the store.
  const inProgress = [...(active.data ?? [])].sort(
    (a, b) => Number(b.status === 'placed') - Number(a.status === 'placed'),
  );

  return (
    <Screen>
      <ErrorText>{friendlyError(active.error ?? finished.error)}</ErrorText>

      <View style={styles.group}>
        <Text type="heading">In progress</Text>
        {inProgress.length === 0 && (
          <Card>
            <Empty emoji="✅" title="All clear" body="No orders to pack or send out right now." />
          </Card>
        )}
        {inProgress.map((order) => (
          <StoreOrderCard key={order.id} order={order} />
        ))}
      </View>

      {(finished.data?.length ?? 0) > 0 && (
        <View style={styles.group}>
          <Text type="heading">Finished</Text>
          {finished.data?.map((order) => (
            <Card key={order.id}>
              <Row>
                <Text type="headline">{order.shortCode}</Text>
                <Badge label={STORE_STATUS[order.status]} tone={STATUS_TONE[order.status]} />
              </Row>
              <Row>
                <Text type="small" color="textSecondary" style={styles.flex} numberOfLines={1}>
                  {order.dropoff.name} · {formatWhen(order.placedAt)}
                </Text>
                <Text type="smallBold">{formatPaise(order.totalPaise)}</Text>
              </Row>
              {order.cancelReason && (
                <Text type="small" color="textSecondary">
                  Reason: {order.cancelReason}
                </Text>
              )}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.three },
  flex: { flex: 1 },
});
