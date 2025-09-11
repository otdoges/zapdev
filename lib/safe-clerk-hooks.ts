'use client';

import { useUser as clerkUseUser } from '@clerk/nextjs';

export function useSafeUser() {
  try {
    return clerkUseUser();
  } catch (error) {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null
    };
  }
}

export function hasClerkKeys(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key'
  );
}