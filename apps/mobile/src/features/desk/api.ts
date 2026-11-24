import type { CatalogProduct, Inventory, InventoryItem, StoreDashboard, StoreSummary } from '@nukkad/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

/** Everything the store's own screens ask the API for, apart from orders. */

export function useDashboard() {
  return useQuery({
    queryKey: ['store', 'dashboard'],
    queryFn: () => api<StoreDashboard>('/store/dashboard'),
    refetchInterval: 5_000,
  });
}

export function useSetOpen() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (isOpen: boolean) => api<StoreSummary>('/store', { method: 'PATCH', body: { isOpen } }),
    onSettled: () => client.invalidateQueries({ queryKey: ['store', 'dashboard'] }),
  });
}

export function useInventory() {
  return useQuery({ queryKey: ['store', 'inventory'], queryFn: () => api<Inventory>('/store/inventory') });
}

export function useMissingProducts() {
  return useQuery({
    queryKey: ['store', 'inventory', 'missing'],
    queryFn: () => api<CatalogProduct[]>('/store/inventory/missing'),
  });
}

type Shelf = { pricePaise?: number; stock?: number; isAvailable?: boolean };

export function useUpdateInventory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...changes }: Shelf & { productId: string }) =>
      api<InventoryItem>(`/store/inventory/${productId}`, { method: 'PATCH', body: changes }),
    onSettled: () => client.invalidateQueries({ queryKey: ['store'] }),
  });
}

export function useAddInventory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; pricePaise: number; stock: number }) =>
      api<InventoryItem>('/store/inventory', { method: 'POST', body: input }),
    onSettled: () => client.invalidateQueries({ queryKey: ['store'] }),
  });
}
