'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, Session, AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export interface SupabaseProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

type ProviderErrorHandler = (error: Error) => void;
type ProviderAuthStateChangeHandler = (_event: AuthChangeEvent, session: Session | null) => void;

interface SupabaseContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  onError?: ProviderErrorHandler;
  onAuthStateChange?: ProviderAuthStateChangeHandler;
  refresh?: () => Promise<Session | null>;
}

const Context = createContext<SupabaseContextValue>({
  supabase: null,
  session: null,
  loading: true,
  signOut: async () => {},
  onError: () => {},
  onAuthStateChange: () => {},
  refresh: async () => null,
});

export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl === 'https://placeholder.supabase.co' ||
      supabaseAnonKey === 'placeholder-key'
    ) {
      errorLogger.warning(
        ErrorCategory.GENERAL,
        'Supabase environment variables are missing or using placeholders. Authentication will be disabled.'
      );
      if (isMounted) {
        setIsConfigured(false);
        setLoading(false);
      }
      return;
    }

    try {
      // Create Supabase client
      const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      });

      if (!isMounted) return;

      setSupabase(client);
      setIsConfigured(true);

      // Get initial session
      const getInitialSession = async () => {
        try {
          const {
            data: { session },
            error,
          } = await client.auth.getSession();
          if (error) {
            errorLogger.error(ErrorCategory.GENERAL, 'Error getting initial session:', error);
          }
          if (isMounted) {
            setUser(session?.user ?? null);
          }
        } catch (_error) {
          errorLogger.error(ErrorCategory.GENERAL, 'Error getting session:', error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      getInitialSession();

      // Listen for auth changes
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(async (event, session) => {
        errorLogger.info(ErrorCategory.GENERAL, 'Auth state changed:', event, session?.user?.email);

        if (!isMounted) return;

        setUser(session?.user ?? null);
        setLoading(false);

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          // Clear any cached data - but don't force redirect
          errorLogger.info(ErrorCategory.GENERAL, 'User signed out');
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Handle successful sign in
          errorLogger.info(ErrorCategory.GENERAL, 'User signed in:', session.user.email);

          // Try to sync user to database in background (non-blocking)
          try {
            const { syncUserToDatabaseClient } = await import('@/lib/supabase-client-operations');
            await syncUserToDatabaseClient(session.user, client);
            errorLogger.info(ErrorCategory.GENERAL, 'Background user sync successful');
          } catch (_syncError) {
            errorLogger.warning(
              ErrorCategory.GENERAL,
              'Background user sync failed (auth still valid):',
              syncError
            );
            // Don't fail the auth flow for this
          }
        } else if (event === 'TOKEN_REFRESHED') {
          errorLogger.info(
            ErrorCategory.GENERAL,
            'Token refreshed for user:',
            session?.user?.email
          );
        }
      });

      return () => {
        subscription.unsubscribe();
        isMounted = false;
      };
    } catch (_error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Error initializing Supabase:', error);
      if (isMounted) {
        setIsConfigured(false);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const signOut = async () => {
    if (!supabase || !isConfigured) {
      errorLogger.warning(
        ErrorCategory.GENERAL,
        'Supabase client not initialized or not configured'
      );
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        errorLogger.error(ErrorCategory.GENERAL, 'Sign out error:', error);
      } else {
        setUser(null);
      }
    } catch (_error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    if (!supabase || !isConfigured) {
      throw new Error('Supabase client not initialized or not configured');
    }

    try {
      setLoading(true);
      const redirectTo = `${window.location.origin}/auth/callback?next=/chat`;
      errorLogger.info(ErrorCategory.GENERAL, 'GitHub OAuth redirect URL:', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
        },
      });
      if (error) {
        errorLogger.error(ErrorCategory.GENERAL, 'GitHub sign in error:', error);
        setLoading(false);
        throw error;
      }
    } catch (_error) {
      errorLogger.error(ErrorCategory.GENERAL, 'GitHub sign in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase || !isConfigured) {
      return { error: new Error('Supabase client not initialized or not configured') };
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (_error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Email sign in error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase || !isConfigured) {
      return { error: new Error('Supabase client not initialized or not configured') };
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            next: '/chat',
          },
        },
      });
      return { error };
    } catch (_error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Email sign up error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase || !isConfigured) {
      return { error: new Error('Supabase client not initialized or not configured') };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      return { error };
    } catch (_error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Reset password error:', error);
      return { error };
    }
  };

  const value: SupabaseContextValue = {
    supabase,
    session: null,
    loading,
    signOut,
    onError: () => {},
    onAuthStateChange: () => {},
    refresh: async () => null,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
