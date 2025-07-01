import React, { useContext, useState, useEffect } from 'react';
import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';

// Import the existing SupabaseProvider context
import { useSupabase as useSupabaseProvider } from '@/components/SupabaseProvider';

interface UseSupabaseReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Custom hook that wraps the SupabaseProvider context
 * and provides a consistent interface for authentication
 */
export function useSupabase(): UseSupabaseReturn {
  const { supabase, loading, signOut } = useSupabaseProvider();
  
  // Get user from current session
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const getUser = async () => {
      if (!supabase) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        if (isMounted) {
          setUser(null);
        }
      }
    };
    
    getUser();
    
    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (isMounted) {
            setUser(session?.user ?? null);
          }
        }
      );
      
      return () => {
        subscription.unsubscribe();
        isMounted = false;
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [supabase]);
  
  return {
    user,
    loading,
    signOut,
  };
} 