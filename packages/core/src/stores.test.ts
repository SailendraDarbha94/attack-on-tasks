import { describe, expect, it } from 'vitest';

import { distanceMeters, formatDistance } from './geo';
import { LOCALITIES } from './localities';
import { deliveryFeePaise, etaMinutes, pickStore } from './stores';
import type { StoreSummary } from './types';

function store(overrides: Partial<StoreSummary> & Pick<StoreSummary, 'id' | 'lat' | 'lng'>): StoreSummary {
  return {
    name: overrides.id,
    area: overrides.id,
    addressText: '',
    phone: '',
    isOpen: true,
    deliveryRadiusM: 4000,
    deliveryFeePaise: 2500,
    freeDeliveryAbovePaise: 29900,
    minOrderPaise: 9900,
    prepMinutes: 8,
    ...overrides,
  };
}

const jayanagar = store({ id: 'jayanagar', lat: 12.9299, lng: 77.5826 });
const indiranagar = store({ id: 'indiranagar', lat: 12.9719, lng: 77.6412 });
const at = (id: string) => LOCALITIES.find((l) => l.id === id)!;

describe('distance', () => {
  it('measures Jayanagar to Indiranagar at roughly 7.9 km', () => {
    const d = distanceMeters(jayanagar, indiranagar);
    expect(d).toBeGreaterThan(7500);
    expect(d).toBeLessThan(8300);
  });

  it('formats short and long distances', () => {
    expect(formatDistance(344)).toBe('340 m');
    expect(formatDistance(2449)).toBe('2.4 km');
  });
});

describe('pickStore', () => {
  const stores = [jayanagar, indiranagar];

  it('picks the nearest store that delivers', () => {
    expect(pickStore(stores, at('jp-nagar'))?.store.id).toBe('jayanagar');
    expect(pickStore(stores, at('domlur'))?.store.id).toBe('indiranagar');
    expect(pickStore(stores, at('domlur'))?.deliverable).toBe(true);
  });

  it('reports the nearest store as not deliverable when the point is out of range', () => {
    const match = pickStore(stores, at('whitefield'));
    expect(match?.store.id).toBe('indiranagar');
    expect(match?.deliverable).toBe(false);
  });

  it('prefers an open store over a nearer closed one when both deliver', () => {
    const near = store({ id: 'near', lat: 12.93, lng: 77.6, isOpen: false, deliveryRadiusM: 6000 });
    const far = store({ id: 'far', lat: 12.95, lng: 77.6, deliveryRadiusM: 6000 });
    expect(pickStore([near, far], { lat: 12.931, lng: 77.6 })?.store.id).toBe('far');
  });

  it('still returns a closed store when it is the only one that delivers', () => {
    const closed = { ...jayanagar, isOpen: false };
    const match = pickStore([closed, indiranagar], at('jayanagar'));
    expect(match?.store.id).toBe('jayanagar');
    expect(match?.deliverable).toBe(true);
  });

  it('returns null when there are no stores', () => {
    expect(pickStore([], at('jayanagar'))).toBeNull();
  });
});

describe('fees and times', () => {
  it('waives delivery at the threshold', () => {
    expect(deliveryFeePaise(jayanagar, 29899)).toBe(2500);
    expect(deliveryFeePaise(jayanagar, 29900)).toBe(0);
  });

  it('always charges when there is no threshold', () => {
    expect(deliveryFeePaise({ deliveryFeePaise: 2500, freeDeliveryAbovePaise: null }, 999999)).toBe(2500);
  });

  it('adds the ride to the packing time', () => {
    expect(etaMinutes(jayanagar, 0)).toBe(8);
    expect(etaMinutes(jayanagar, 2000)).toBe(16);
  });
});
