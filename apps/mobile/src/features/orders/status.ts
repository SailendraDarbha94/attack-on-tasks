import type { OrderStatus } from '@nukkad/core';

import type { BadgeTone } from '@/components/controls';

/** What the customer is told an order is doing. */
export const CUSTOMER_STATUS: Record<OrderStatus, string> = {
  placed: 'Waiting for the store',
  accepted: 'Being packed',
  ready: 'Packed',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  rejected: 'Declined by the store',
  cancelled: 'Cancelled',
};

/** The same statuses in the store's words. */
export const STORE_STATUS: Record<OrderStatus, string> = {
  placed: 'New',
  accepted: 'Packing',
  ready: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  placed: 'warning',
  accepted: 'info',
  ready: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

/** What the store's button says for moving an order to each status. */
export const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  accepted: 'Accept order',
  rejected: 'Reject',
  ready: 'Mark packed',
  out_for_delivery: 'Send out for delivery',
  delivered: 'Mark delivered',
};

/** The steps a customer watches an order go through, in order. */
export const TIMELINE: { status: OrderStatus; label: string; stamp: 'placedAt' | 'acceptedAt' | 'readyAt' | 'dispatchedAt' | 'deliveredAt' }[] = [
  { status: 'placed', label: 'Order placed', stamp: 'placedAt' },
  { status: 'accepted', label: 'Store accepted', stamp: 'acceptedAt' },
  { status: 'ready', label: 'Packed', stamp: 'readyAt' },
  { status: 'out_for_delivery', label: 'On the way', stamp: 'dispatchedAt' },
  { status: 'delivered', label: 'Delivered', stamp: 'deliveredAt' },
];

export const PAYMENT_LABEL = { cash: 'Cash on delivery', upi: 'UPI on delivery' } as const;
