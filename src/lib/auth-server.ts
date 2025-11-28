import { ConvexHttpClient } from "convex/browser";
import { getUser as getWorkOSUser, getAccessToken, getSignInUrl, getSignUpUrl, signOut } from "@workos-inc/authkit-nextjs";

/**
 * Get the authenticated user from WorkOS
 */
export async function getUser() {
  return await getWorkOSUser();
}

/**
 * Get the authentication token for Convex
 */
export async function getToken() {
  return await getAccessToken();
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

  const accessToken = await getToken();

  if (accessToken) {
    httpClient.setAuth(accessToken);
  }

  return httpClient;
}

/**
 * Get WorkOS sign in URL
 */
export { getSignInUrl, getSignUpUrl, signOut };
