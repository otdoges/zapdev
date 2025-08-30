'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function UserSyncWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const upsertUser = useMutation(api.users.upsertUser);
  const upsertUserSubscription = useMutation(api.users.upsertUserSubscription);

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !user) return;

      try {
        // Check if user exists in Convex
        if (!currentUser) {
          console.log('User not found in Convex, creating...');
          
          const primaryEmail = user.emailAddresses.find(email => 
            email.id === user.primaryEmailAddressId
          );
          
          if (!primaryEmail?.emailAddress) {
            console.warn('No primary email found for user');
            return;
          }

          // Create user in Convex
          await upsertUser({
            email: primaryEmail.emailAddress,
            fullName: user.fullName || undefined,
            avatarUrl: user.imageUrl || undefined,
            username: user.username || undefined,
          });

          // Create default subscription
          await upsertUserSubscription({
            userId: user.id,
            planId: 'free',
            status: 'active',
            currentPeriodStart: Date.now(),
            currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
          });

          console.log('Successfully synced user to Convex');
        } else {
          // User exists, optionally update with latest info from Clerk
          const primaryEmail = user.emailAddresses.find(email => 
            email.id === user.primaryEmailAddressId
          );
          
          if (primaryEmail?.emailAddress && 
              (currentUser.email !== primaryEmail.emailAddress || 
               currentUser.fullName !== user.fullName ||
               currentUser.avatarUrl !== user.imageUrl)) {
            
            await upsertUser({
              email: primaryEmail.emailAddress,
              fullName: user.fullName || undefined,
              avatarUrl: user.imageUrl || undefined,
              username: user.username || undefined,
            });
            
            console.log('Updated user info in Convex');
          }
        }
      } catch (error) {
        console.error('Error syncing user with Convex:', error);
      }
    }

    // Only run if Convex query has completed (whether user exists or not)
    if (isLoaded && user && currentUser !== undefined) {
      syncUser();
    }
  }, [isLoaded, user, currentUser, upsertUser, upsertUserSubscription]);

  return <>{children}</>;
}