import type { Address, AddressInput } from '@nukkad/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

const KEY = ['addresses'] as const;

export function useAddresses() {
  return useQuery({ queryKey: KEY, queryFn: () => api<Address[]>('/me/addresses') });
}

export function useCreateAddress() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => api<Address>('/me/addresses', { method: 'POST', body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAddress() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/me/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  });
}

/** House, street and area on one line. */
export function addressLine(address: Address): string {
  return [address.line1, address.line2, address.area].filter(Boolean).join(', ');
}
