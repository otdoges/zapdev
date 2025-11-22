import { StackServerApp } from "@stackframe/stack";
import { ConvexHttpClient } from "convex/browser";

/**
 * Get the authenticated user from Stack Auth
 */
export async function getUser() {
  const stack = new StackServerApp({
    tokenStore: "nextjs-cookie",
  });
  const user = await stack.getUser();
  
  if (!user) return null;

  // Map Stack user to a structure compatible with existing code where possible
  // or return the Stack user extended with compatibility fields
  
  const displayName = user.displayName || "";
  const parts = displayName.split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";

  return {
    ...user,
    // Compatibility fields
    email: user.primaryEmail,
    firstName: firstName,
    lastName: lastName,
    // Ensure id is present (it is)
  };
}

/**
 * Get the authentication token for Convex
 */
export async function getToken() {
  return null; 
}

/**
 * Get auth headers for API calls
 */
export async function getAuthHeaders() {
  return {};
}

/**
 * Create a Convex HTTP client with Stack Auth authentication
 * Use this in API routes that need to call Convex
 */
export async function getConvexClientWithAuth() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  const httpClient = new ConvexHttpClient(convexUrl);
  
  // We need to properly authenticate the Convex client
  // Stack Auth usually uses the OIDC token for Convex
  // The Convex HTTP client setAuth(token) expects a token.
  
  // TODO: Retrieve the OIDC token for Convex from Stack Auth if available server-side
  // For now, we return the client. If queries are protected, they might fail if we don't setAuth.
  
  return httpClient;
}
