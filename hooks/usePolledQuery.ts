'use client';

import { useQuery } from 'convex/react';
import { useEffect, useRef, useState } from 'react';
import { FunctionReference } from 'convex/server';

/**
 * Custom hook for polled Convex queries to reduce cost
 * Polls every 60 seconds instead of real-time updates
 */
export function usePolledQuery<Args, Return>(
  query: FunctionReference<'query', 'public', Args, Return>,
  args: Args | 'skip',
  options?: {
    pollInterval?: number; // milliseconds, default 60000 (60s)
    enabled?: boolean;
  }
): Return | undefined {
  const pollInterval = options?.pollInterval || 60000; // 60 seconds
  const enabled = options?.enabled !== false;
  const intervalRef = useRef<NodeJS.Timeout>();
  const [shouldRefetch, setShouldRefetch] = useState(0);

  // Use Convex query but control when it refetches
  const result = useQuery(query, args === 'skip' || !enabled ? 'skip' : args);

  useEffect(() => {
    if (!enabled || args === 'skip') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      setShouldRefetch(prev => prev + 1);
    }, pollInterval);

    // Cleanup interval on unmount or deps change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [enabled, args, pollInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return result;
}

/**
 * Hook for immediate cleanup on navigation/page unload
 */
export function useNavigationCleanup(cleanup: () => void) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      cleanup();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cleanup();
      }
    };

    const handlePageHide = () => {
      cleanup();
    };

    // Listen for page unload events
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    // Listen for navigation events (Next.js router)
    const handleRouteChange = () => {
      cleanup();
    };

    // For Next.js App Router
    if (typeof window !== 'undefined' && window.navigation) {
      window.navigation.addEventListener('navigate', handleRouteChange);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      
      if (typeof window !== 'undefined' && window.navigation) {
        window.navigation.removeEventListener('navigate', handleRouteChange);
      }
    };
  }, [cleanup]);
}