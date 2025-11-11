import { cookies } from "next/headers";
import { auth } from "./auth";
import { SESSION_COOKIE_NAME } from "./session-cookie";

/**
 * Get the current session from Better Auth
 * Use this in API routes and server components
 */
export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionToken) {
    return null;
  }

  try {
    // Verify and get session from Better Auth
    const session = await auth.api.getSession({
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken.value}`,
      },
    });

    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 * Returns the user object
 */
export async function requireSession() {
  const session = await getSession();
  
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  return session;
}
