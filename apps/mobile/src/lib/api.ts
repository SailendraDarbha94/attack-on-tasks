import { isErrorCode, type ErrorCode } from '@nukkad/core';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useAuth } from './auth-store';

function defaultApiBase(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  // DEV ONLY. The machine running Metro also runs the API, so reuse its
  // address: a phone on the same Wi-Fi then reaches the API with no setup.
  // A release build has no Metro, so it must be given EXPO_PUBLIC_API_URL;
  // without it the base stays empty and every request fails loudly below
  // instead of quietly calling the phone's own localhost.
  if (__DEV__) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') return `http://${window.location.hostname}:4000`;
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    return `http://${host ?? 'localhost'}:4000`;
  }
  return '';
}

export const API_BASE = defaultApiBase();

/** A reply from the API that was not a success. `code` is set for errors the API names. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: ErrorCode | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown };

/** Calls the API as whoever is signed in. Throws ApiError, or TypeError when offline. */
export async function api<T>(path: string, { method = 'GET', body }: Options = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error('EXPO_PUBLIC_API_URL was not set when this build was made, so it has no API to talk to.');
  }
  const token = useAuth.getState().token;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Only with a body: the API's server rejects a JSON content type on an empty request.
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.ok) {
    return (response.status === 204 ? undefined : await response.json()) as T;
  }

  const payload = (await response.json().catch(() => null)) as { code?: unknown; message?: unknown } | null;
  const code = isErrorCode(payload?.code) ? payload.code : null;
  // The token stopped working (expired, or the account is gone): sign out
  // here, once, rather than have every screen show the same failure.
  if (response.status === 401 && token && useAuth.getState().token === token) {
    useAuth.getState().setToken(null);
  }
  const message = Array.isArray(payload?.message) ? payload.message[0] : payload?.message;
  throw new ApiError(typeof message === 'string' ? message : `Request failed (${response.status})`, response.status, code);
}
