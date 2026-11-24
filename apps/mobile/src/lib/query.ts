import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A "no" from the API will be a "no" again; only retry when the network failed.
      retry: (failures, error) => !(error instanceof ApiError) && failures < 2,
      staleTime: 10_000,
    },
  },
});
