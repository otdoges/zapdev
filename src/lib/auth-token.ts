import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

// Memory-based auth token management (secure alternative to cookies)
class AuthTokenManager {
  private token: string | null = null;
  private tokenFetchTime: number | null = null;
  private readonly TOKEN_REFRESH_THRESHOLD = 4 * 60 * 1000; // 4 minutes

  setToken(token: string | null): void {
    this.token = token;
    this.tokenFetchTime = token ? Date.now() : null;
  }

  getToken(): string | null {
    return this.token;
  }

  shouldRefreshToken(): boolean {
    if (!this.token || !this.tokenFetchTime) return false;
    return Date.now() - this.tokenFetchTime > this.TOKEN_REFRESH_THRESHOLD;
  }

  clearToken(): void {
    this.token = null;
    this.tokenFetchTime = null;
  }

  hasToken(): boolean {
    return !!this.token;
  }
}

export const authTokenManager = new AuthTokenManager();

// Simplified hook that relies on Clerk's built-in session management
export const useAuthToken = () => {
  const { getToken, isSignedIn, isLoaded } = useClerkAuth();
  
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!isSignedIn || !isLoaded) {
      authTokenManager.clearToken();
      return null;
    }

    const cachedToken = authTokenManager.getToken();
    
    // Return cached token if it's recent enough
    if (cachedToken && !authTokenManager.shouldRefreshToken()) {
      return cachedToken;
    }

    try {
      // Get fresh token from Clerk (Clerk handles validation internally)
      const freshToken = await getToken();
      authTokenManager.setToken(freshToken);
      return freshToken;
    } catch (error) {
      // Log error without exposing token details
      console.error('Failed to refresh auth token');
      authTokenManager.clearToken();
      return null;
    }
  }, [getToken, isSignedIn, isLoaded]);

  const clearStoredToken = useCallback(() => {
    authTokenManager.clearToken();
  }, []);

  const ensureFreshTokenForTRPC = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getValidToken();
      if (token) {
        // Ensure authTokenManager has the latest token
        authTokenManager.setToken(token);
        console.log('Token refreshed for tRPC:', { 
          hasToken: !!token, 
          tokenAge: authTokenManager.shouldRefreshToken() ? 'fresh' : 'cached' 
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to ensure fresh token for tRPC:', error);
      return false;
    }
  }, [getValidToken]);

  return {
    getValidToken,
    clearStoredToken,
    hasStoredToken: () => authTokenManager.hasToken(),
    ensureFreshTokenForTRPC
  };
};