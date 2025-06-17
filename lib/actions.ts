import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

/**
 * Hook to sync the current Clerk user with Convex.
 * Call this in components where you need the user's Convex ID.
 * 
 * @returns The user's Convex ID or null if not found/authenticated
 */
export function useConvexUser() {
  const { user, isSignedIn } = useUser();
  const syncUser = useMutation(api.users.syncClerkUser);
  const convexUser = useQuery(
    api.users.getUserByClerkId, 
    isSignedIn ? { clerkId: user?.id || "" } : "skip"
  );

  useEffect(() => {
    // If user is signed in and we have their data, sync with Convex
    if (isSignedIn && user?.id) {
      const primaryEmail = user.emailAddresses[0]?.emailAddress;
      
      syncUser({
        clerkId: user.id,
        email: primaryEmail,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        avatarUrl: user.imageUrl || undefined,
      });
    }
  }, [isSignedIn, user?.id, syncUser, user]);

  return convexUser ? convexUser._id : null;
}

/**
 * Function to get the current user in an API route
 */
export async function getCurrentUser(clerkUserId: string, db: any) {
  if (!clerkUserId) return null;
  
  return await db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkUserId))
    .first();
} 