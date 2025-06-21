import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

/**
 * Hook to get the current authenticated user from Better Auth session
 */
export function useAuthUser() {
  const { data: session, isPending } = useSession();

  return {
    user: session?.user || null,
    session,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
  };
}

/**
 * Fast cookie-based auth check that doesn't block rendering
 */
function checkAuthCookies(): boolean {
  if (typeof window === 'undefined') return false;
  
  const authCookies = [
    'better-auth.session_token',
    'better-auth.session', 
    '__Secure-better-auth.session_token',
    '__Host-better-auth.session_token'
  ];
  
  return authCookies.some(cookieName => {
    return document.cookie.split(';').some(cookie => {
      const [name, value] = cookie.trim().split('=');
      return name === cookieName && value && value !== 'undefined';
    });
  });
}

/**
 * Optimized function to check if user is authenticated
 * Uses cookies for immediate feedback, then validates with session
 */
export function useIsAuthenticated() {
  const { data: session, isPending } = useSession();
  const [cookieAuth, setCookieAuth] = useState<boolean | null>(null);
  
  // Check cookies immediately on mount for instant feedback
  useEffect(() => {
    setCookieAuth(checkAuthCookies());
  }, []);
  
  // If we have session data, use that as the source of truth
  if (!isPending && session !== undefined) {
    return {
      isAuthenticated: !!session?.user,
      isLoading: false,
    };
  }
  
  // While session is loading, use cookie-based check for better UX
  if (isPending && cookieAuth !== null) {
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

 