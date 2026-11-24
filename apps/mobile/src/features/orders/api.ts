import { isActive, type Order, type OrderStatus, type PlaceOrderInput } from '@nukkad/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

/** How often a screen showing live orders asks again, in milliseconds. */
const LIVE = 5_000;

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api<Order[]>('/orders'),
    // Keep asking only while something is still on its way.
    refetchInterval: (query) => (query.state.data?.some((order) => isActive(order.status)) ? LIVE : false),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => api<Order>(`/orders/${id}`),
    refetchInterval: (query) => (query.state.data && !isActive(query.state.data.status) ? false : LIVE),
  });
}

export function usePlaceOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) => api<Order>('/orders', { method: 'POST', body: input }),
    onSuccess: (order) => {
      client.setQueryData(['orders', order.id], order);
      // The shelf just changed, and so did the list of orders.
      void client.invalidateQueries({ queryKey: ['orders'], exact: true });
      void client.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
}

export function useCancelOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<Order>(`/orders/${id}/cancel`, { method: 'POST' }),
    onSettled: () => client.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useStoreOrders(scope: 'active' | 'finished') {
  return useQuery({
    queryKey: ['store', 'orders', scope],
    queryFn: () => api<Order[]>(`/store/orders?scope=${scope}`),
    // New orders must appear by themselves; finished ones can wait.
    refetchInterval: scope === 'active' ? LIVE : 30_000,
  });
}

export function useTransitionOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, to, reason }: { orderId: string; to: OrderStatus; reason?: string }) =>
      api<Order>(`/store/orders/${orderId}/transition`, { method: 'POST', body: { to, reason } }),
    // Whether it worked or not, what is on screen is now out of date.
    onSettled: () => client.invalidateQueries({ queryKey: ['store'] }),
  });
}
