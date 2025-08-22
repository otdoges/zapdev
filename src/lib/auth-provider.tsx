import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useConvexAuth } from 'convex/react';
import { useAuthToken } from './auth-token';

// Enhanced auth hook that combines Clerk and Convex auth with secure token management
export const useAuthWithTokens = () => {
  const clerkAuth = useClerkAuth();
  const convexAuth = useConvexAuth();
  const { getValidToken, clearStoredToken } = useAuthToken();

  // Enhanced getToken that uses secure memory-based storage
  const getTokenSecure = async () => {
    try {
      // Get token using the secure token manager
      if (clerkAuth.isSignedIn && clerkAuth.isLoaded) {
        return await getValidToken();
      }
      
      return null;
    } catch {
      console.error('Error getting auth token');
      clearStoredToken();
      return null;
    }
  };

  // Clear tokens on sign out
  const signOut = async () => {
    clearStoredToken();
    if (clerkAuth.signOut) {
      await clerkAuth.signOut();
    }
  };

  return {
    ...clerkAuth,
    ...convexAuth,
    getToken: getTokenSecure,
    signOut,
    isFullyAuthenticated: convexAuth.isAuthenticated && clerkAuth.isSignedIn,
  };
};