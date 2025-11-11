/**
 * OAuth Token Refresh Utility
 *
 * Handles checking OAuth token expiration and refreshing tokens when needed.
 * This ensures that OAuth sessions remain valid even after provider token expiration.
 */

/**
 * Check if an OAuth token is expired
 * @param expiresAt - Token expiration time in milliseconds (Unix timestamp)
 * @param bufferMs - Buffer time in milliseconds before expiration to consider token as expired (default 5 minutes)
 * @returns true if token is expired or will expire soon, false otherwise
 */
export function isOAuthTokenExpired(
  expiresAt: number | undefined,
  bufferMs: number = 5 * 60 * 1000 // 5 minutes
): boolean {
  if (!expiresAt) {
    // No expiration time means token doesn't expire
    return false;
  }

  const now = Date.now();
  const expirationThreshold = expiresAt - bufferMs;

  return now >= expirationThreshold;
}

/**
 * Check if an OAuth token needs refresh
 * Considers both expiration and refresh token availability
 */
export function shouldRefreshOAuthToken(
  expiresAt: number | undefined,
  refreshToken: string | undefined,
  bufferMs?: number
): boolean {
  // Can only refresh if we have a refresh token
  if (!refreshToken) {
    return false;
  }

  return isOAuthTokenExpired(expiresAt, bufferMs);
}

/**
 * OAuth provider token refresh implementations
 * These are placeholder functions that would integrate with each provider's API
 */

/**
 * Refresh Google OAuth token using refresh token
 * @param refreshToken - Google refresh token
 * @param clientId - Google OAuth client ID
 * @param clientSecret - Google OAuth client secret
 * @returns New access token and expiration time, or null if refresh fails
 */
export async function refreshGoogleToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!response.ok) {
      console.error("Failed to refresh Google token:", response.statusText);
      return null;
    }

    const data = await response.json() as {
      access_token: string;
      expires_in: number;
      error?: string;
    };

    if (data.error) {
      console.error("Google token refresh error:", data.error);
      return null;
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return null;
  }
}

/**
 * Refresh GitHub OAuth token using refresh token
 * @param refreshToken - GitHub refresh token
 * @param clientId - GitHub OAuth client ID
 * @param clientSecret - GitHub OAuth client secret
 * @returns New access token and expiration time, or null if refresh fails
 */
export async function refreshGitHubToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!response.ok) {
      console.error("Failed to refresh GitHub token:", response.statusText);
      return null;
    }

    const data = await response.json() as {
      access_token: string;
      expires_in: number;
      error?: string;
    };

    if (data.error) {
      console.error("GitHub token refresh error:", data.error);
      return null;
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error("Error refreshing GitHub token:", error);
    return null;
  }
}

/**
 * Generic OAuth token refresh router
 * Dispatches to appropriate provider-specific refresh function
 */
export async function refreshOAuthTokenForProvider(
  provider: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  switch (provider.toLowerCase()) {
    case "google":
      return refreshGoogleToken(refreshToken, clientId, clientSecret);
    case "github":
      return refreshGitHubToken(refreshToken, clientId, clientSecret);
    default:
      console.warn(`Token refresh not implemented for provider: ${provider}`);
      return null;
  }
}
