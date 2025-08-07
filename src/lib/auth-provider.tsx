import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useConvexAuth } from 'convex/react';
import { AuthCookies } from './auth-cookies';

// Enhanced auth hook that combines Clerk and Convex auth with cookie fallback
export const useAuthWithCookies = () => {
  const clerkAuth = useClerkAuth();
  const convexAuth = useConvexAuth();

  // Enhanced getToken that uses cookies as fallback
  const getTokenWithFallback = async () => {
    try {
      // First, try to get token from Clerk
      if (clerkAuth.isSignedIn) {
        const token = await clerkAuth.getToken();
        if (token) {
          // Store token in cookie for persistence
          AuthCookies.set(token);
          return token;
        }
      }
      
      // Fallback to cookie if Clerk fails
      const cookieToken = AuthCookies.get();
      if (cookieToken && AuthCookies.isValid()) {
        return cookieToken;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      
      // Try cookie as last resort
      const cookieToken = AuthCookies.get();
      if (cookieToken && AuthCookies.isValid()) {
        return cookieToken;
      }
      
      return null;
    }
  };

  // Clear tokens on sign out
  const signOut = async () => {
    AuthCookies.remove();
    if (clerkAuth.signOut) {
      await clerkAuth.signOut();
    }
  };

  return {
    ...clerkAuth,
    ...convexAuth,
    getToken: getTokenWithFallback,
    signOut,
    isFullyAuthenticated: convexAuth.isAuthenticated && clerkAuth.isSignedIn,
  };
};