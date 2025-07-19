import { useCallback, useMemo, useState, useEffect } from 'react';
import { useWorkOSAuth } from './useWorkOSAuth';

export function useConvexAuth() {
  const { user, loading } = useWorkOSAuth();
  const [idToken, setIdToken] = useState<string | null>(null);

  // Get the stored ID token
  useEffect(() => {
    const storedToken = localStorage.getItem('workos_id_token');
    if (storedToken) {
      setIdToken(storedToken);
    }
  }, []);

  const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    // For WorkOS, we need to get the ID token (JWT) that Convex can validate
    // In a production app, you'd refresh this token if needed
    const token = localStorage.getItem('workos_id_token');
    
    if (!token && !forceRefreshToken) {
      return null;
    }

    // If we need to force refresh or don't have a token, 
    // we should redirect back to WorkOS auth flow
    if (forceRefreshToken || !token) {
      // In a real implementation, you might try to refresh the token here
      // For now, we'll return null which will trigger re-authentication
      return null;
    }

    return token;
  }, []);

  return useMemo(() => ({
    isLoading: loading,
    isAuthenticated: !!user && !!idToken,
    fetchAccessToken,
  }), [loading, user, idToken, fetchAccessToken]);
}