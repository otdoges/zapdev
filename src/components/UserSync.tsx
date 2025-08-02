import { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function UserSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user: clerkUser } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (isAuthenticated && !isLoading && clerkUser) {
      upsertUser({
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        fullName: clerkUser.fullName || undefined,
        avatarUrl: clerkUser.imageUrl || undefined,
        username: clerkUser.username || `${clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0]}_${Date.now()}`,
        bio: '',
      }).catch((error) => {
        console.error('Failed to sync user to Convex:', error);
      });
    }
  }, [isAuthenticated, isLoading, clerkUser?.id, upsertUser]);

  return <>{children}</>;
}