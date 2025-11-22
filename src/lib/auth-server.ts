import { ConvexHttpClient } from "convex/browser";
import { withAuth } from "@workos-inc/authkit-nextjs";

/**
 * Get the authenticated user from WorkOS AuthKit
 */
export async function getUser() {
  try {
    const { user } = await withAuth();
    return user;
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

/**
 * Get the authentication token for Convex
 */
export async function getToken() {
  try {
    const { accessToken } = await withAuth();
    return accessToken || null;
  } catch (error) {
    console.error("Failed to get token:", error);
    return null;
  }
}

/**
 * Get auth headers for API calls
 */
export async function getAuthHeaders() {
  const token = await getToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Create a Convex HTTP client with WorkOS authentication
 * Use this in API routes that need to call Convex
 */
export async function getConvexClientWithAuth() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  const httpClient = new ConvexHttpClient(convexUrl);
  
  const { accessToken } = await withAuth();
  
  if (accessToken) {
    httpClient.setAuth(accessToken);
  }
  
  return httpClient;
}
