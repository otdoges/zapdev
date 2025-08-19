import React, { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuthToken } from '@/lib/auth-token';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const convexAuth = useConvexAuth();
  const clerkAuth = useClerkAuth();
  const { getValidToken, clearStoredToken } = useAuthToken();

  useEffect(() => {
    // Handle authentication recovery on page load/refresh
    const handleAuthRecovery = async () => {
      // If Convex shows not authenticated but Clerk is signed in
      if (!convexAuth.isAuthenticated && !convexAuth.isLoading && clerkAuth.isSignedIn && clerkAuth.isLoaded) {
        try {
          // Get a fresh token to sync with Convex
          const freshToken = await getValidToken();
          if (freshToken) {
            // Let Convex naturally re-authenticate without forcing reload
            console.log('Auth token refreshed for Convex sync');
          }
        } catch {
          console.error('Auth recovery failed');
          clearStoredToken();
        }
      }
    };

    // Run recovery after initial auth check
    const timeout = setTimeout(handleAuthRecovery, 1000);
    return () => clearTimeout(timeout);
  }, [convexAuth.isAuthenticated, convexAuth.isLoading, clerkAuth.isSignedIn, clerkAuth.isLoaded, getValidToken, clearStoredToken]);

  // Handle sign out cleanup
  useEffect(() => {
    if (!clerkAuth.isSignedIn && clerkAuth.isLoaded) {
      clearStoredToken();
    }
  }, [clerkAuth.isSignedIn, clerkAuth.isLoaded, clearStoredToken]);

  return <>{children}</>;
};