import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import React from "react";

interface AuthUser {
  _id: string;
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  username?: string;
  bio?: string;
}

export const useAuth = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  
  // Get or create user in Convex database - only query when fully authenticated
  const convexUser = useQuery(api.users.getCurrentUser, isLoaded && isSignedIn && clerkUser ? {} : "skip");
  const upsertUser = useMutation(api.users.upsertUser);

  // Sync Clerk user with Convex user
  React.useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser && convexUser === null) {
      upsertUser({
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        fullName: clerkUser.fullName || undefined,
        avatarUrl: clerkUser.imageUrl || undefined,
        username: clerkUser.username || `${clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0]}_${Date.now()}`,
        bio: '',
      }).catch((error) => {
        console.error('Failed to sync user:', error);
        // Consider adding user-facing error handling here
      });
    }
  }, [isLoaded, isSignedIn, clerkUser?.id, convexUser, clerkUser, upsertUser]);

  return {
    user: convexUser,
    clerkUser,
    isLoading: !isLoaded,
    isAuthenticated: isLoaded && isSignedIn && !!convexUser,
    isSignedIn,
  };
};