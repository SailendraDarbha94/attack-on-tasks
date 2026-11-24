import { nextStatuses, type Order, type OrderStatus } from '@nukkad/core';
import { useState } from 'react';

import { Badge } from '@/components/controls';
import { Text } from '@/components/text';
import { Button, Card, ErrorText, Row } from '@/components/ui';
import { friendlyError } from '@/lib/errors';
import { formatWhen } from '@/lib/format';

import { useTransitionOrder } from './api';
import { OrderSummary } from './order-summary';
import { ACTION_LABEL, STATUS_TONE, STORE_STATUS } from './status';

/** One order as the store sees it, with the buttons for whatever it may do next. */
export function StoreOrderCard({ order }: { order: Order }) {
  const transition = useTransitionOrder();
  const [confirmingReject, setConfirmingReject] = useState(false);
  const actions = nextStatuses(order.status, 'store');

  function act(to: OrderStatus) {
    // Rejecting cannot be undone, so it takes two taps.
    if (to === 'rejected' && !confirmingReject) {
      setConfirmingReject(true);
      return;
    }
    transition.mutate({ orderId: order.id, to });
  }

  return (
    <Card>
      <Row>
        <Text type="headline">{order.shortCode}</Text>
        <Badge label={STORE_STATUS[order.status]} tone={STATUS_TONE[order.status]} dot />
      </Row>
      <Text type="caption" color="textSecondary">
        Placed {formatWhen(order.placedAt)}
      </Text>
      <OrderSummary order={order} forStore />
      <ErrorText>{friendlyError(transition.error)}</ErrorText>
      {actions.map((to) => (
        <Button
          key={to}
          variant={to === 'rejected' ? 'danger' : 'primary'}
          label={to === 'rejected' && confirmingReject ? 'Tap again to reject' : (ACTION_LABEL[to] ?? to)}
          busy={transition.isPending && transition.variables?.to === to}
          disabled={transition.isPending}
          onPress={() => act(to)}
        />
      ))}
    </Card>
  );
}
