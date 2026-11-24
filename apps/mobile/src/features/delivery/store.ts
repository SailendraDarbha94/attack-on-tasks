import 'expo-sqlite/localStorage/install';

import { isValidLatLng, pickStore, type LatLng, type StoreSummary } from '@nukkad/core';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { api } from '@/lib/api';

/**
 * Where the customer wants things delivered. It decides which store serves
 * them, so it is chosen before anything else.
 */
export type DeliverTo = LatLng & {
  /** How it was chosen: the phone's position, a neighbourhood from the list, or a saved address. */
  kind: 'gps' | 'locality' | 'address';
  /** What the home screen calls it: "Current location", "Jayanagar", "Home". */
  label: string;
  /** Known for neighbourhoods and addresses; used to prefill the address form. */
  area?: string;
  pincode?: string;
  /** Set when `kind` is `address`. */
  addressId?: string;
};

type DeliveryState = {
  deliverTo: DeliverTo | null;
  /** The saved address chosen for the order being built. */
  addressId: string | null;
  setDeliverTo: (deliverTo: DeliverTo | null) => void;
  setAddressId: (addressId: string | null) => void;
};

export const useDelivery = create<DeliveryState>()(
  persist(
    (set) => ({
      deliverTo: null,
      addressId: null,
      // Browsing from a saved address means ordering to it, unless they pick another.
      setDeliverTo: (deliverTo) =>
        set(deliverTo?.kind === 'address' ? { deliverTo, addressId: deliverTo.addressId ?? null } : { deliverTo }),
      setAddressId: (addressId) => set({ addressId }),
    }),
    {
      name: 'nukkad.delivery',
      storage: createJSONStorage(() => localStorage),
      merge: (stored, current) => {
        const saved = (stored as Partial<DeliveryState> | null)?.deliverTo;
        const addressId = (stored as Partial<DeliveryState> | null)?.addressId;
        return {
          ...current,
          deliverTo: saved && isValidLatLng(saved) ? saved : null,
          addressId: typeof addressId === 'string' ? addressId : null,
        };
      },
    },
  ),
);

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => api<StoreSummary[]>('/stores'),
    // A store opening or closing should show up without a restart.
    refetchInterval: 60_000,
  });
}

/** The store that serves the chosen delivery location, once both are known. */
export function useServingStore() {
  const stores = useStores();
  const deliverTo = useDelivery((state) => state.deliverTo);
  const match = stores.data && deliverTo ? pickStore(stores.data, deliverTo) : null;
  return { stores, deliverTo, match };
}
