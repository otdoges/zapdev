import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { AuthCookies } from '@/lib/auth-cookies';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: unknown;
  token: string | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isSignedIn && isLoaded) {
        const newToken = await getToken();
        if (newToken) {
          setToken(newToken);
          AuthCookies.set(newToken);
        }
      } else {
        setToken(null);
        AuthCookies.remove();
      }
    } catch (error) {
      console.error('Failed to refresh auth token:', error);
      // Try to use cached token if available
      const cachedToken = AuthCookies.get();
      if (cachedToken && AuthCookies.isValid()) {
        setToken(cachedToken);
      } else {
        setToken(null);
        AuthCookies.remove();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, isLoaded, getToken]);

  useEffect(() => {
    refreshAuth();
  }, [isSignedIn, isLoaded, user?.id, refreshAuth]);

  // Periodic token refresh to prevent expiration
  useEffect(() => {
    if (isSignedIn) {
      const interval = setInterval(() => {
        refreshAuth();
      }, 4 * 60 * 1000); // Refresh every 4 minutes

      return () => clearInterval(interval);
    }
  }, [isSignedIn, refreshAuth]);

  // Initialize token from cookie on app start
  useEffect(() => {
    const cachedToken = AuthCookies.get();
    if (cachedToken && AuthCookies.isValid() && !token) {
      setToken(cachedToken);
    }
    setIsLoading(false);
  }, [token]);

  const value: AuthContextType = {
    isAuthenticated: isLoaded && isSignedIn && !!token,
    isLoading: !isLoaded || isLoading,
    user,
    token,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};