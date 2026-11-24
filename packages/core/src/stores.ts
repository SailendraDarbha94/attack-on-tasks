import { distanceMeters, type LatLng } from './geo';
import type { StoreSummary } from './types';

export type StoreMatch = {
  store: StoreSummary;
  distanceM: number;
  /** The point is inside the store's delivery radius. */
  deliverable: boolean;
};

/** How far a point is from a store, and whether the store delivers there. */
export function matchStore(store: StoreSummary, point: LatLng): StoreMatch {
  const distanceM = distanceMeters(point, store);
  return { store, distanceM, deliverable: distanceM <= store.deliveryRadiusM };
}

/**
 * The store that serves a point: the nearest one that delivers there.
 *
 * An open store beats a closed one when both deliver, even if it is a little
 * further, because a closed store cannot take the order. When no store
 * delivers to the point, the nearest one comes back with `deliverable: false`
 * so the app can say how far outside the area the customer is.
 */
export function pickStore(stores: readonly StoreSummary[], point: LatLng): StoreMatch | null {
  const matches = stores.map((store) => matchStore(store, point));
  if (matches.length === 0) return null;
  const rank = (m: StoreMatch) => (m.deliverable ? (m.store.isOpen ? 0 : 1) : 2);
  return matches.reduce((best, m) =>
    rank(m) < rank(best) || (rank(m) === rank(best) && m.distanceM < best.distanceM) ? m : best,
  );
}

/** Delivery is free once the basket reaches the store's threshold. */
export function deliveryFeePaise(
  store: Pick<StoreSummary, 'deliveryFeePaise' | 'freeDeliveryAbovePaise'>,
  subtotalPaise: number,
): number {
  if (store.freeDeliveryAbovePaise !== null && subtotalPaise >= store.freeDeliveryAbovePaise) return 0;
  return store.deliveryFeePaise;
}

/** At or below this many left, a product counts as running low. */
export const LOW_STOCK_AT = 5;

/** Scooter pace through city streets, with the detours a straight line hides. */
const METERS_PER_MINUTE = 250;

/** Packing time plus the ride, rounded up to the next whole minute. */
export function etaMinutes(store: Pick<StoreSummary, 'prepMinutes'>, distanceM: number): number {
  return store.prepMinutes + Math.ceil(distanceM / METERS_PER_MINUTE);
}
