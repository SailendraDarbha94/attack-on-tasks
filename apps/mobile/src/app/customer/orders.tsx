import { formatPaise, type Order } from '@nukkad/core';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Badge } from '@/components/controls';
import { Text } from '@/components/text';
import { Button, Card, Empty, ErrorText, Loading, Row, Screen } from '@/components/ui';
import { useMyOrders } from '@/features/orders/api';
import { CUSTOMER_STATUS, STATUS_TONE } from '@/features/orders/status';
import { friendlyError } from '@/lib/errors';
import { formatWhen } from '@/lib/format';

/** "2 × Tomato, Onion and 3 more". */
function itemsLine(order: Order): string {
  const names = order.items.slice(0, 2).map((item) => (item.qty > 1 ? `${item.qty} × ${item.name}` : item.name));
  const rest = order.items.length - names.length;
  return rest > 0 ? `${names.join(', ')} and ${rest} more` : names.join(', ');
}

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useMyOrders();

  if (orders.isPending) return <Loading />;

  return (
    <Screen>
      <ErrorText>{friendlyError(orders.error)}</ErrorText>
      {orders.data?.length === 0 && (
        <Empty emoji="🧾" title="No orders yet" body="Your orders will appear here, with live updates while they are on the way.">
          <Button label="Go to the shop" onPress={() => router.back()} />
        </Empty>
      )}
      {orders.data?.map((order) => (
        <Pressable
          key={order.id}
          accessibilityRole="button"
          onPress={() => router.push(`/customer/order/${order.id}`)}
          style={({ pressed }) => pressed && styles.pressed}>
          <Card>
            <Row>
              <Text type="headline">{order.shortCode}</Text>
              <Badge label={CUSTOMER_STATUS[order.status]} tone={STATUS_TONE[order.status]} dot />
            </Row>
            <Text type="small" color="textSecondary">
              {order.store.name} · {formatWhen(order.placedAt)}
            </Text>
            <Row>
              <Text type="small" numberOfLines={1} style={styles.items}>
                {itemsLine(order)}
              </Text>
              <Text type="smallBold">{formatPaise(order.totalPaise)}</Text>
            </Row>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  items: { flex: 1 },
});
