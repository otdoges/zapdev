'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { debounce } from '@/lib/debounce';

export function UserSyncWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { user: currentUser, isLoading: userLoading } = useCurrentUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const upsertUserSubscription = useMutation(api.users.upsertUserSubscription);
  
  // Track whether we've already synced this user
  const syncedUserRef = useRef<string | null>(null);
  const isInitialSync = useRef(true);

  // Debounced sync function to prevent rapid calls
  const debouncedSync = useCallback(
    debounce(async (userData: any, convexUser: any) => {
      if (!userData || !isLoaded || userLoading) return;
      
      // Prevent duplicate syncing for same user
      if (syncedUserRef.current === userData.id && !isInitialSync.current) return;

      try {
        if (!convexUser) {
          console.log('User not found in Convex, creating...');
          
          const primaryEmail = userData.emailAddresses.find((email: any) =>
            email.id === userData.primaryEmailAddressId
          );
          
          if (!primaryEmail?.emailAddress) {
            console.warn('No primary email found for user');
            return;
          }

          await upsertUser({
            email: primaryEmail.emailAddress,
            fullName: userData.fullName || undefined,
            avatarUrl: userData.imageUrl || undefined,
            username: userData.username || undefined,
          });

          await upsertUserSubscription({
            userId: userData.id,
            planId: 'free',
            status: 'active',
            currentPeriodStart: Date.now(),
            currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
          });

          console.log('Successfully synced user to Convex');
        } else {
          const primaryEmail = userData.emailAddresses.find((email: any) =>
            email.id === userData.primaryEmailAddressId
          );
          
          const needsUpdate = primaryEmail?.emailAddress && (
            convexUser.email !== primaryEmail.emailAddress ||
            convexUser.fullName !== userData.fullName ||
            convexUser.avatarUrl !== userData.imageUrl
          );
          
          if (needsUpdate) {
            await upsertUser({
              email: primaryEmail.emailAddress,
              fullName: userData.fullName || undefined,
              avatarUrl: userData.imageUrl || undefined,
              username: userData.username || undefined,
            });
            
            console.log('Updated user info in Convex');
          }
        }
        
        syncedUserRef.current = userData.id;
        isInitialSync.current = false;
      } catch (error) {
        console.error('Error syncing user with Convex:', error);
      }
    }, 1000), // 1 second debounce
    [upsertUser, upsertUserSubscription, isLoaded, userLoading]
  );

  useEffect(() => {
    if (isLoaded && user && !userLoading) {
      debouncedSync(user, currentUser);
    }
  }, [isLoaded, user?.id, userLoading, debouncedSync]);

  return <>{children}</>;
}