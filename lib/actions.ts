import { useSupabase } from '@/components/SupabaseProvider';
import { useEffect, useState } from 'react';
import { hasAuthCookies } from '@/lib/auth-constants';

/**
 * Hook to get the current authenticated user from Supabase session
 */
export function useAuthUser() {
  const { user, loading } = useSupabase();

  return {
    user: user || null,
    session: user ? { user } : null,
    isLoading: loading,
    isAuthenticated: !!user,
  };
}

/**
 * Fast cookie-based auth check that doesn't block rendering
 */
function checkAuthCookies(): boolean {
  if (typeof window === 'undefined') return false;
  return hasAuthCookies(document.cookie);
}

/**
 * Optimized function to check if user is authenticated
 * Uses cookies for immediate feedback, then validates with session
 */
export function useIsAuthenticated() {
  const { user, loading } = useSupabase();
  const [cookieAuth, setCookieAuth] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Check cookies immediately on mount for instant feedback
  useEffect(() => {
    setHasMounted(true);
    setCookieAuth(checkAuthCookies());
  }, []);

  // Return stable loading state during SSR
  if (!hasMounted) {
    return {
      isAuthenticated: false,
      isLoading: true,
    };
  }

  // If we have definitive user data from Supabase, use that
  if (!loading) {
    return {
      isAuthenticated: !!user,
      isLoading: false,
    };
  }

  // While session is loading, use cookie-based check for optimistic UI
  return {
    isAuthenticated: cookieAuth,
    isLoading: false, // Show optimistic state instead of loading
  };
}
