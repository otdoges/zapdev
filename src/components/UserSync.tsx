import { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function UserSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user: clerkUser } = useUser();
  const { isSignedIn } = useClerkAuth();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isAuthenticated && !isLoading && clerkUser) {
      // Validate required user data
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      if (!email) {
        console.error('User missing primary email address');
        return;
      }

      upsertUser({
        email,
        fullName: clerkUser.fullName || undefined,
        avatarUrl: clerkUser.imageUrl || undefined,
        username: clerkUser.username || `${email.split('@')[0]}_${Date.now()}`,
        bio: '',
      }).catch((error) => {
        console.error('Failed to sync user to Convex:', error);
        // In production, you might want to show a user-friendly error
        if (import.meta.env.PROD) {
          console.error('Authentication sync failed. Please refresh the page or contact support.');
        }
      });
    }
  }, [isAuthenticated, isLoading, clerkUser?.id, clerkUser?.primaryEmailAddress?.emailAddress, clerkUser?.imageUrl, clerkUser?.fullName, clerkUser?.username, upsertUser, clerkUser]);

  return <>{children}</>;
}