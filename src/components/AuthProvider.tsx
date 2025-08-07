import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import type { UserResource } from '@clerk/types';
import { useAuthToken } from '@/lib/auth-token';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserResource | null | undefined;
  token: string | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useUser();
  const { getValidToken, clearStoredToken } = useAuthToken();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      if (isSignedIn && isLoaded) {
        const newToken = await getValidToken();
        setToken(newToken);
      } else {
        setToken(null);
        clearStoredToken();
      }
    } catch (error) {
      console.error('Failed to refresh auth token');
      setToken(null);
      clearStoredToken();
    }
  }, [isSignedIn, isLoaded, getValidToken, clearStoredToken]);

  // Main auth effect - handles initial load and auth state changes
  useEffect(() => {
    const handleAuth = async () => {
      if (!isLoaded) {
        // Still loading Clerk, keep loading state
        return;
      }
      
      setIsLoading(true);
      await refreshAuth();
      setIsLoading(false);
    };
    
    handleAuth();
  }, [isSignedIn, isLoaded, user?.id, refreshAuth]);

  // Periodic token refresh to prevent expiration
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      const interval = setInterval(refreshAuth, 4 * 60 * 1000); // Every 4 minutes
      return () => clearInterval(interval);
    }
  }, [isSignedIn, isLoaded, refreshAuth]);

  const value: AuthContextType = {
    isAuthenticated: isLoaded && isSignedIn && !!token,
    isLoading: isLoading || !isLoaded,
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