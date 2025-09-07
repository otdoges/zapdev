'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useCurrentUser() {
  const [cachedUser, setCachedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const cacheRef = useRef(null);
  const queryRef = useRef(null);

  // Only run the query once and cache it
  useEffect(() => {
    if (cacheRef.current !== null) {
      // Already cached, use the cached value
      setCachedUser(cacheRef.current);
      setIsLoading(false);
      return;
    }

    // Run the query only if not cached
    queryRef.current = useQuery(api.users.getCurrentUser);
    
    if (queryRef.current !== undefined) {
      cacheRef.current = queryRef.current;
      setCachedUser(queryRef.current);
      setIsLoading(false);
    }
  }, []);

  return { 
    user: cachedUser, 
    isLoading: isLoading || queryRef.current === undefined, 
    error,
    refetch: () => {
      // Force refetch and update cache
      const result = useQuery(api.users.getCurrentUser, undefined, { 
        revalidateIfStale: true 
      });
      if (result !== undefined) {
        cacheRef.current = result;
        setCachedUser(result);
      }
    }
  };
}