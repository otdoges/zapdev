'use client';

import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/nextjs';
import { convex } from '@/convex-client';
import { UserSyncWrapper } from './UserSyncWrapper';

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  // If Convex is not configured, render children without provider
  if (!convex) {
    console.warn('Convex not configured. Chat history features will be disabled.');
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
      <UserSyncWrapper>
        {children}
      </UserSyncWrapper>
    </ConvexProviderWithClerk>
  );
}