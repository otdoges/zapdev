import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';

// Cookie utilities for auth token management
export const AuthCookies = {
  TOKEN_KEY: 'clerk_session_token',
  
  set(token: string, expiresInDays = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (expiresInDays * 24 * 60 * 60 * 1000));
    document.cookie = `${this.TOKEN_KEY}=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  },
  
  get(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.TOKEN_KEY) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },
  
  remove() {
    document.cookie = `${this.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },
  
  isValid(): boolean {
    const token = this.get();
    if (!token) return false;
    
    try {
      // Basic JWT validation - check if it's properly formatted
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decode payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp > now;
    } catch (error) {
      console.warn('Invalid token format:', error);
      return false;
    }
  }
};

// Hook to manage auth cookies automatically
export const useAuthCookies = () => {
  const { getToken, isSignedIn } = useClerkAuth();
  
  useEffect(() => {
    const syncToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            AuthCookies.set(token);
          }
        } catch (error) {
          console.error('Failed to get or set auth token:', error);
        }
      } else {
        AuthCookies.remove();
      }
    };
    
    syncToken();
    
    // Set up periodic token refresh
    const interval = setInterval(syncToken, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);
  
  return {
    getStoredToken: AuthCookies.get,
    isTokenValid: AuthCookies.isValid,
    clearToken: AuthCookies.remove
  };
};