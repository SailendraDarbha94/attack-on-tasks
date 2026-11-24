import { ERROR_MESSAGES } from '@nukkad/core';

import { ApiError } from './api';

/** What to show a person for whatever a request threw. Null when nothing went wrong. */
export function friendlyError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.code ? ERROR_MESSAGES[error.code] : error.message;
  // `fetch` throws a TypeError when it cannot reach the server at all.
  if (error instanceof TypeError) return 'Can’t reach Nukkad. Check your connection and try again.';
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
