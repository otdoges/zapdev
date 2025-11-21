/**
 * Stack Auth Server Integration
 * Provides server-side authentication utilities for Stack Auth
 */

import { StackServerApp } from "@stackframe/stack";

// Lazy-initialize Stack Auth server app to avoid build-time errors
let stackServerAppInstance: StackServerApp | null = null;

function getStackServerApp(): StackServerApp {
  if (!stackServerAppInstance) {
    // Validate required environment variables
    if (!process.env.NEXT_PUBLIC_STACK_PROJECT_ID) {
      throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID environment variable is required");
    }
    if (!process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY) {
      throw new Error("NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY environment variable is required");
    }
    if (!process.env.STACK_SECRET_SERVER_KEY) {
      throw new Error("STACK_SECRET_SERVER_KEY environment variable is required");
    }

    stackServerAppInstance = new StackServerApp({
      projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
      publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
      secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
    });
  }
  return stackServerAppInstance;
}

// Export for use in layout.tsx
export const stackServerApp = getStackServerApp();

/**
 * Get the currently authenticated user from Stack Auth
 * Returns null if no user is authenticated
 */
export async function getUser() {
  try {
    const app = getStackServerApp();
    return await app.getUser();
  } catch (error) {
    console.error("Error getting user from Stack Auth:", error);
    return null;
  }
}

/**
 * Get the user ID from the current request
 * Returns null if no user is authenticated
 */
export async function getUserIdFromRequest(): Promise<string | null> {
  const user = await getUser();
  return user?.id || null;
}

/**
 * Require authentication - throws error if user is not authenticated
 * Use this in API routes that require authentication
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized - User must be authenticated");
  }
  return user;
}

/**
 * Get user email
 */
export async function getUserEmail(): Promise<string | null> {
  const user = await getUser();
  return user?.primaryEmail || null;
}
