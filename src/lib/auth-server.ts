import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/**
 * Get the authenticated user from Convex Auth (server-side)
 * This should be called from Server Components or API routes
 * Note: With Convex Auth, authentication is primarily client-side
 * For server-side API routes, users should be verified through Convex queries
 */
export async function getUser() {
  try {
    // Try to fetch current user through Convex
    // This relies on the auth cookie being present
    const user = await fetchQuery(api.users.getCurrentUser);
    if (!user) return null;
    
    return {
      id: user.tokenIdentifier,
      email: user.email,
      name: user.name,
      image: user.image,
      // Compatibility properties
      primaryEmail: user.email,
      displayName: user.name,
    };
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

/**
 * Get the authentication token for Convex
 * Returns the token if user is authenticated
 */
export async function getToken() {
  try {
    const user = await getUser();
    return user ? "authenticated" : null;
  } catch (error) {
    console.error("Failed to get token:", error);
    return null;
  }
}

/**
 * Get auth headers for API calls
 * Convex Auth handles this automatically, this is for manual use if needed
 */
export async function getAuthHeaders() {
  const user = await getUser();
  if (!user) return {};
  return {};
}

/**
 * Fetch a Convex query with authentication
 * Use this in Server Components or API routes
 */
export async function fetchQueryWithAuth<T>(
  query: any,
  args: any = {}
): Promise<T> {
  return fetchQuery(query, args);
}

/**
 * Fetch a Convex mutation with authentication
 * Use this in Server Components or API routes  
 */
export async function fetchMutationWithAuth<T>(
  mutation: any,
  args: any = {}
): Promise<T> {
  return fetchMutation(mutation, args);
}
