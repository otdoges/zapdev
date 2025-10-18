import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
import superjson from 'superjson';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // PERFORMANCE: Increased stale time for better caching
        staleTime: 60 * 1000, // 1 minute (was 30s)
        gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
        retry: 1, // Only retry once to fail fast
        refetchOnWindowFocus: false, // Disable refetch on window focus for better UX
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0, // Don't retry mutations
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
