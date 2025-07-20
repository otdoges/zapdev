import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useConvexAuth } from 'convex/react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function UserSync({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUserFromClerk);

  useEffect(() => {
    if (isLoaded && isAuthenticated && user) {
      // Sync user data to Convex
      createOrUpdateUser({
        email: user.primaryEmailAddress?.emailAddress || '',
        fullName: user.fullName || undefined,
        avatarUrl: user.imageUrl || undefined,
      }).catch((error) => {
        console.error('Failed to sync user to Convex:', error);
      });
    }
  }, [isLoaded, isAuthenticated, user, createOrUpdateUser]);

  return <>{children}</>;
}