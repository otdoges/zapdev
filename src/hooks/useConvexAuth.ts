import { useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';

export function useConvexAuth() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    if (!isSignedIn) {
      return null;
    }

    try {
      // Get Clerk JWT token that Convex can validate
      const token = await getToken({ 
        template: "convex",
        skipCache: forceRefreshToken 
      });
      return token;
    } catch (error) {
      console.error('Failed to fetch access token:', error);
      return null;
    }
  }, [isSignedIn, getToken]);

  return useMemo(() => ({
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn ?? false,
    fetchAccessToken,
  }), [isLoaded, isSignedIn, fetchAccessToken]);
}