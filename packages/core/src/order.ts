import type { Role } from './roles';

export const ORDER_STATUSES = [
  'placed',
  'accepted',
  'ready',
  'out_for_delivery',
  'delivered',
  'rejected',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** `system` is for timeouts and other automatic moves; it is not a user role. */
export type OrderActor = Role | 'system';

export const TERMINAL_STATUSES: readonly OrderStatus[] = ['delivered', 'rejected', 'cancelled'];

/**
 * Who may move an order from one status to another.
 *
 * The API enforces this table; the apps use it to decide which buttons to show.
 *
 * There is no rider yet, so the store hands the order over and marks it
 * delivered. When riders arrive, `out_for_delivery -> delivered` moves to them
 * and nothing else here changes.
 */
const TRANSITIONS: Record<OrderStatus, Partial<Record<OrderStatus, readonly OrderActor[]>>> = {
  placed: {
    accepted: ['store'],
    rejected: ['store'],
    cancelled: ['customer', 'system', 'admin'],
  },
  accepted: {
    ready: ['store'],
    cancelled: ['admin'],
  },
  ready: {
    out_for_delivery: ['store'],
    cancelled: ['admin'],
  },
  out_for_delivery: {
    delivered: ['store'],
    cancelled: ['admin'],
  },
  delivered: {},
  rejected: {},
  cancelled: {},
};

export function canTransition(from: OrderStatus, to: OrderStatus, actor: OrderActor): boolean {
  return TRANSITIONS[from][to]?.includes(actor) ?? false;
}

/** Statuses the actor may move the order to from its current status. */
export function nextStatuses(from: OrderStatus, actor: OrderActor): OrderStatus[] {
  return ORDER_STATUSES.filter((to) => canTransition(from, to, actor));
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Still being worked on: not delivered, rejected or cancelled. */
export function isActive(status: OrderStatus): boolean {
  return !isTerminal(status);
}

/** Stock taken by an order goes back on the shelf when it ends this way. */
export function returnsStock(status: OrderStatus): boolean {
  return status === 'rejected' || status === 'cancelled';
}

export const PAYMENT_METHODS = ['cash', 'upi'] as const;
/** Both are collected at the door for now. Online payment comes later. */
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** The most of one product a single order may hold. */
export const MAX_QTY_PER_ITEM = 20;
/** The most different products a single order may hold. */
export const MAX_LINES_PER_ORDER = 60;
