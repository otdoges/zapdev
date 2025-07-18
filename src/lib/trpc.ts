import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../convex/trpc/router';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_CONVEX_URL}/trpc`,
      headers: () => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
}); 