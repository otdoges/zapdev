import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../convex/trpc/router';
import { authTokenManager } from '@/lib/auth-token';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_CONVEX_URL}/trpc`,
      headers: () => {
        const token = authTokenManager.getToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
}); 