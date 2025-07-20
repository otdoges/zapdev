import { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function UserSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUserFromClerk);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // The user data will be available through Convex auth context
      // We'll update the mutation to use the authenticated user's identity
      createOrUpdateUser({}).catch((error) => {
        console.error('Failed to sync user to Convex:', error);
      });
    }
  }, [isAuthenticated, isLoading, createOrUpdateUser]);

  return <>{children}</>;
}