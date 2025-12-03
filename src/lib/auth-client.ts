"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth as useConvexAuthBase } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to access the current authenticated user
 * Compatible with Stack Auth's useUser() hook for easier migration
 */
export function useUser() {
  const { isAuthenticated, isLoading } = useConvexAuthBase();
  const { signOut } = useAuthActions();
  const userData = useQuery(api.users.getCurrentUser);
  
  if (isLoading) {
    return null;
  }
  
  if (!isAuthenticated || !userData) {
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
