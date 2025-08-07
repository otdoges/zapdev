import React, { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { AuthCookies, useAuthCookies } from '@/lib/auth-cookies';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const convexAuth = useConvexAuth();
  const clerkAuth = useClerkAuth();
  const { getStoredToken, clearToken } = useAuthCookies();

  useEffect(() => {
    // Handle authentication recovery on page load/refresh
    const handleAuthRecovery = async () => {
      // If Convex shows not authenticated but we have a valid cookie token
      if (!convexAuth.isAuthenticated && !convexAuth.isLoading) {
        const storedToken = getStoredToken();
        
        if (storedToken && AuthCookies.isValid()) {
          // Try to refresh Clerk session if needed
          try {
            if (clerkAuth.isSignedIn) {
              const freshToken = await clerkAuth.getToken({ skipCache: true });
              if (freshToken) {
                AuthCookies.set(freshToken);
                // Let Convex naturally re-authenticate without forcing reload
                console.log('Auth token refreshed, waiting for Convex sync');
              }
            }
          } catch (error) {
            console.warn('Auth recovery failed:', error);
            clearToken();
          }
        } else if (storedToken) {
          // Remove invalid token
          clearToken();
        }
      }
    };

    // Run recovery after initial auth check
    const timeout = setTimeout(handleAuthRecovery, 1000);
    return () => clearTimeout(timeout);
  }, [convexAuth.isAuthenticated, convexAuth.isLoading, clerkAuth.isSignedIn, getStoredToken, clearToken, clerkAuth]);

  // Handle sign out cleanup
  useEffect(() => {
    if (!clerkAuth.isSignedIn && clerkAuth.isLoaded) {
      clearToken();
    }
  }, [clerkAuth.isSignedIn, clerkAuth.isLoaded, clearToken]);

  return <>{children}</>;
};