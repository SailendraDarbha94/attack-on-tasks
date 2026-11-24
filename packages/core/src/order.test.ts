import { describe, expect, it } from 'vitest';

import { ORDER_STATUSES, canTransition, isActive, isTerminal, nextStatuses, returnsStock } from './order';

describe('order transitions', () => {
  it('lets the store walk an order from placed to delivered', () => {
    expect(nextStatuses('placed', 'store')).toEqual(['accepted', 'rejected']);
    expect(nextStatuses('accepted', 'store')).toEqual(['ready']);
    expect(nextStatuses('ready', 'store')).toEqual(['out_for_delivery']);
    expect(nextStatuses('out_for_delivery', 'store')).toEqual(['delivered']);
  });

  it('lets a customer cancel only before the store accepts', () => {
    expect(canTransition('placed', 'cancelled', 'customer')).toBe(true);
    expect(canTransition('accepted', 'cancelled', 'customer')).toBe(false);
    expect(canTransition('ready', 'cancelled', 'customer')).toBe(false);
  });

  it('gives a customer no way to move an order forward', () => {
    for (const from of ORDER_STATUSES) {
      expect(nextStatuses(from, 'customer').filter((to) => to !== 'cancelled')).toEqual([]);
    }
  });

  it('allows nothing out of a finished order', () => {
    for (const from of ['delivered', 'rejected', 'cancelled'] as const) {
      expect(isTerminal(from)).toBe(true);
      expect(isActive(from)).toBe(false);
      for (const actor of ['customer', 'store', 'admin', 'system'] as const) {
        expect(nextStatuses(from, actor)).toEqual([]);
      }
    }
  });

  it('puts stock back only for rejected and cancelled orders', () => {
    expect(ORDER_STATUSES.filter(returnsStock)).toEqual(['rejected', 'cancelled']);
  });
});
