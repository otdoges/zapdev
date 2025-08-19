import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../convex/trpc/router';
import { authTokenManager } from '@/lib/auth-token';

export const trpc = createTRPCReact<AppRouter>();

// Add runtime check to ensure router types are properly resolved
if (typeof window !== 'undefined') {
  console.log('tRPC client initialized:', {
    hasTrpc: !!trpc,
    hasBilling: !!trpc?.billing,
    billingKeys: trpc?.billing ? Object.keys(trpc.billing) : [],
    isCreateCheckoutSessionAvailable: !!trpc?.billing?.createCheckoutSession
  });
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_CONVEX_URL}/trpc`,
      headers: () => {
        const token = authTokenManager.getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Debug logging for tRPC requests
        console.log('tRPC request headers:', {
          url: `${import.meta.env.VITE_CONVEX_URL}/trpc`,
          hasToken: !!token,
          tokenLength: token?.length || 0,
          convexUrl: import.meta.env.VITE_CONVEX_URL
        });
        
        return headers;
      },
      fetch: (url, options) => {
        // Enhanced fetch with error logging
        console.log('tRPC fetch request:', { url, method: options?.method });
        
        return fetch(url, options)
          .then(response => {
            console.log('tRPC fetch response:', { 
              status: response.status, 
              statusText: response.statusText,
              ok: response.ok 
            });
            return response;
          })
          .catch(error => {
            console.error('tRPC fetch error:', error);
            throw error;
          });
      }
    }),
  ],
}); 