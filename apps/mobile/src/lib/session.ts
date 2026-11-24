import type { AppRole, Me, Session } from '@nukkad/core';
import { useQuery } from '@tanstack/react-query';

import { useCart } from '@/features/cart/store';

import { api } from './api';
import { useAuth } from './auth-store';
import { queryClient } from './query';

const meKey = (token: string | null) => ['me', token] as const;

type SessionState = {
  /** `unreachable`: there is a token, but the API could not be asked whose it is. */
  status: 'loading' | 'signed-out' | 'signed-in' | 'unreachable';
  me: Me | null;
  chosenRole: AppRole | null;
  chooseRole: (role: AppRole | null) => void;
  retry: () => void;
};

export function useSession(): SessionState {
  const token = useAuth((state) => state.token);
  const chosenRole = useAuth((state) => state.chosenRole);
  const chooseRole = useAuth((state) => state.chooseRole);
  const me = useQuery({ queryKey: meKey(token), queryFn: () => api<Me>('/me'), enabled: token !== null, staleTime: 60_000 });

  const status = token === null ? 'signed-out' : me.data ? 'signed-in' : me.isError ? 'unreachable' : 'loading';
  return { status, me: me.data ?? null, chosenRole, chooseRole, retry: () => void me.refetch() };
}

/** Starts a session with what a sign-in returned. The root layout does the rest. */
export function startSession(session: Session) {
  queryClient.setQueryData(meKey(session.token), session.me);
  useAuth.getState().setToken(session.token);
}

export function signOut() {
  // The cart belongs to whoever built it.
  useCart.getState().clear();
  useAuth.getState().setToken(null);
  // Nothing fetched for one account may be shown to the next.
  queryClient.clear();
}
