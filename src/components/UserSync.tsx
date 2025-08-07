import { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { AuthCookies } from '@/lib/auth-cookies';

export default function UserSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user: clerkUser } = useUser();
  const { getToken, isSignedIn } = useClerkAuth();
  const upsertUser = useMutation(api.users.upsertUser);

  // Store auth token in cookies when user signs in
  useEffect(() => {
    const storeAuthToken = async () => {
      if (isSignedIn && clerkUser) {
        try {
          const token = await getToken();
          if (token) {
            AuthCookies.set(token);
          }
        } catch (error) {
          console.error('Failed to store auth token:', error);
        }
      }
    };

    storeAuthToken();
  }, [isSignedIn, clerkUser?.id, getToken, clerkUser]);

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