import type { Catalog } from '@nukkad/core';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

/** What one store sells, with its prices and what is left. */
export function useCatalog(storeId: string | undefined) {
  return useQuery({
    queryKey: ['catalog', storeId],
    queryFn: () => api<Catalog>(`/stores/${storeId}/catalog`),
    enabled: storeId !== undefined,
    // Prices and stock move while the customer browses.
    refetchInterval: 30_000,
  });
}
