import { useSupabase } from "@/components/SupabaseProvider";
import { useEffect, useState } from "react";
import { hasAuthCookies } from "@/lib/auth-constants";

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
  const [cookieAuth, setCookieAuth] = useState<boolean | null>(null);
  
  // Check cookies immediately on mount for instant feedback
  useEffect(() => {
    setCookieAuth(checkAuthCookies());
  }, []);
  
  // If we have user data, use that as the source of truth
  if (!loading && user !== undefined) {
    return {
      isAuthenticated: !!user,
      isLoading: false,
    };
  }
  
  // While session is loading, use cookie-based check for better UX
  if (loading && cookieAuth !== null) {
    return {
      isAuthenticated: cookieAuth,
      isLoading: true, // Still loading session, but we have cookie indication
    };
  }
  
  // Fallback to loading state
  return {
    isAuthenticated: false,
    isLoading: true,
  };
}

 