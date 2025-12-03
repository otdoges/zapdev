"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth as useConvexAuthBase } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to access the current authenticated user
 * Compatible with Stack Auth's useUser() hook for easier migration
 *
 * This hook properly handles the async nature of Convex Auth by:
 * 1. Checking if the user is authenticated (from Convex Auth state)
 * 2. Fetching user data when authenticated (from Convex query)
 * 3. Returning the user object only when both are available
 */
export function useUser() {
  const { isAuthenticated, isLoading: authIsLoading } = useConvexAuthBase();
  const { signOut } = useAuthActions();

  // Always fetch user data - the query will use the current auth context
  // This ensures data is fetched immediately after sign-in
  const userData = useQuery(api.users.getCurrentUser);

  // While auth is still loading, return null
  if (authIsLoading) {
    return null;
  }

  // If not authenticated, return null
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated but user data is still loading (undefined), return null
  // This will trigger a re-render when userData is available
  if (userData === undefined) {
    return null;
  }

  // If no user data found (null response), return null
  if (userData === null) {
    return null;
  }

  // Return a user-like object compatible with Stack Auth
  return {
    id: userData.tokenIdentifier,
    email: userData.email,
    name: userData.name,
    image: userData.image,
    // Compatibility properties for old Stack Auth code
    displayName: userData.name,
    primaryEmail: userData.email,
    profileImageUrl: userData.image,
    signOut,
  };
}

/**
 * Hook to access auth actions (sign in, sign out, etc.)
 */
export function useAuth() {
  return useAuthActions();
}

/**
 * Hook to check authentication status
 */
export function useAuthStatus() {
  return useConvexAuthBase();
}
