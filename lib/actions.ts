import { useSession } from "@/lib/auth-client";

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
 * Function to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { data: session, isPending } = useSession();
  
  return {
    isAuthenticated: !!session?.user,
    isLoading: isPending,
  };
}

 