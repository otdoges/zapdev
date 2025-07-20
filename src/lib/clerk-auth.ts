import { User } from '@clerk/clerk-react';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Extract user data from Clerk user object
 */
export function extractUserData(clerkUser: User): AuthenticatedUser {
  return {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    name: clerkUser.fullName || undefined,
    firstName: clerkUser.firstName || undefined,
    lastName: clerkUser.lastName || undefined,
  };
}

/**
 * Frontend authentication using Clerk React hook
 * This should be used in React components
 */
export function useClerkAuth() {
  // This will be imported and used in components
  return {
    isLoaded: false, // Will be replaced with actual Clerk hook
    isSignedIn: false,
    user: null as User | null,
  };
}

/**
 * Verify Clerk JWT token on the backend
 * This function should be used in your backend API endpoints
 */
export async function verifyClerkToken(token: string): Promise<AuthenticatedUser> {
  try {
    // In a real backend implementation, you would verify the JWT
    // using Clerk's backend SDK
    
    // For now, we'll decode the token (in production, use proper verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Extract user info from the JWT payload
    return {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
      firstName: payload.first_name,
      lastName: payload.last_name,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Mock function for development - replace with actual Clerk backend verification
 */
export async function authenticateWithClerk(headers: Record<string, string | undefined>): Promise<AuthenticatedUser> {
  const authHeader = headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  // In development, you might want to allow a mock token
  if (token === 'mock-token' && process.env.NODE_ENV === 'development') {
    return {
      id: 'user_mock123',
      email: 'test@example.com',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
    };
  }
  
  return await verifyClerkToken(token);
} 