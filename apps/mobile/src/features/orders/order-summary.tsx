import { formatPaise, type Order } from '@nukkad/core';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Row } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';

import { PAYMENT_LABEL } from './status';

/** What was ordered, what it costs, and where it goes. Shared by the customer and the store. */
export function OrderSummary({ order, forStore }: { order: Order; forStore?: boolean }) {
  return (
    <View style={styles.summary}>
      <View style={styles.group}>
        {order.items.map((item) => (
          <Row key={item.productId} style={styles.top}>
            <Text type="smallBold" style={styles.qty}>
              {item.qty} ×
            </Text>
            <View style={styles.flex}>
              <Text type="small">
                {item.emoji} {item.name}
              </Text>
              <Text type="caption" color="textSecondary">
                {item.unitLabel}
              </Text>
            </View>
            <Text type="small">{formatPaise(item.unitPricePaise * item.qty)}</Text>
          </Row>
        ))}
      </View>

      <View style={styles.rule} />

      <View style={styles.group}>
        <Row>
          <Text type="small" color="textSecondary">
            Item total
          </Text>
          <Text type="small">{formatPaise(order.subtotalPaise)}</Text>
        </Row>
        <Row>
          <Text type="small" color="textSecondary">
            Delivery
          </Text>
          <Text type="small" color={order.deliveryFeePaise === 0 ? 'successText' : 'text'}>
            {order.deliveryFeePaise === 0 ? 'Free' : formatPaise(order.deliveryFeePaise)}
          </Text>
        </Row>
        <Row>
          <Text type="headline">{forStore ? 'To collect' : 'Total'}</Text>
          <Text type="headline">{formatPaise(order.totalPaise)}</Text>
        </Row>
        <Text type="caption" color="textSecondary">
          {PAYMENT_LABEL[order.paymentMethod]}
        </Text>
      </View>

      <View style={styles.rule} />

      <View style={styles.group}>
        <Text type="overline" color="textSecondary">
          Deliver to
        </Text>
        <Text type="smallBold">
          {order.dropoff.name}
          {forStore && order.dropoff.phone ? ` · ${order.dropoff.phone}` : ''}
        </Text>
        <Text type="small" color="textSecondary">
          {order.dropoff.text}
        </Text>
        {order.notes && (
          <Text type="small" style={styles.note}>
            “{order.notes}”
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: Spacing.three },
  group: { gap: Spacing.two },
  top: { alignItems: 'flex-start' },
  flex: { flex: 1 },
  qty: { minWidth: 30, fontVariant: ['tabular-nums'] },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.line },
  note: { fontStyle: 'italic' },
});
