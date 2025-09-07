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

  // Run the query at top level and cache it
  const queryResult = useQuery(api.users.getCurrentUser);
  
  useEffect(() => {
    if (queryResult !== undefined) {
      cacheRef.current = queryResult;
      setCachedUser(queryResult);
      setIsLoading(false);
    }
  }, [queryResult]);

  return {
    user: cachedUser,
    isLoading: isLoading || queryResult === undefined,
    error,
    refetch: () => {
      // The query will automatically refetch when needed
      // Convex handles revalidation
    }
  };
}