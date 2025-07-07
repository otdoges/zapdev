'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

interface SupabaseContext {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
}

const Context = createContext<SupabaseContext>({
  user: null,
  loading: true,
  signOut: async () => {},
  signInWithGitHub: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
});

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Set up a shorter global timeout to prevent infinite loading
    const globalTimeout = setTimeout(() => {
      if (isMounted) {
        errorLogger.warning(ErrorCategory.GENERAL, 'Auth initialization timeout - setting loading to false');
        setLoading(false);
        setUser(null);
      }
    }, 5000); // Reduced to 5 seconds for faster feedback

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔧 Supabase Environment Check:', {
      url: supabaseUrl ? 'Set' : 'Missing',
      key: supabaseAnonKey ? 'Set' : 'Missing',
      urlValue: supabaseUrl,
    });

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl === 'https://placeholder.supabase.co' ||
      supabaseAnonKey === 'placeholder-key' ||
      supabaseUrl.includes('placeholder') ||
      supabaseAnonKey.includes('placeholder')
    ) {
      console.error('❌ Supabase environment variables are missing or using placeholders');
      errorLogger.warning(
        ErrorCategory.GENERAL,
        'Supabase environment variables are missing or using placeholders. Authentication will be disabled.'
      );
      if (isMounted) {
        setIsConfigured(false);
        setLoading(false);
        setUser(null);
      }
      clearTimeout(globalTimeout);
      return;
    }

    console.log('✅ Supabase environment variables configured');

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

      if (!isMounted) {
        clearTimeout(globalTimeout);
        return;
      }

      setSupabase(client);
      setIsConfigured(true);
      console.log('✅ Supabase client created successfully');

      // Get initial session with shorter timeout
      const getInitialSession = async () => {
        try {
          console.log('🔍 Getting initial session...');
          
          // Create a shorter timeout promise
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Session check timeout')), 3000) // Reduced to 3 seconds
          );

          // Race between session check and timeout
          const sessionPromise = client.auth.getSession();
          
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          
          if (result.error) {
            console.error('❌ Error getting initial session:', result.error);
            errorLogger.error(ErrorCategory.GENERAL, 'Error getting initial session:', result.error);
          } else {
            console.log('✅ Initial session check completed', result.data?.session?.user ? 'User found' : 'No user');
          }

          if (isMounted) {
            setUser(result.data?.session?.user ?? null);
          }
        } catch (error) {
          console.error('❌ Session check failed, continuing without auth:', error);
          errorLogger.error(ErrorCategory.GENERAL, 'Error getting session (falling back to no auth):', error);
          // On error, assume no user and continue
          if (isMounted) {
            setUser(null);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
            console.log('✅ Auth loading completed');
          }
          clearTimeout(globalTimeout);
        }
      };

      getInitialSession();

      // Listen for auth changes
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        errorLogger.info(ErrorCategory.GENERAL, `Auth state changed: ${event} ${session?.user?.email || 'no user'}`);

        if (!isMounted) return;

        setUser(session?.user ?? null);
        setLoading(false);

        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          // Clear any cached data - but don't force redirect
          console.log('👋 User signed out');
          errorLogger.info(ErrorCategory.GENERAL, 'User signed out');
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Handle successful sign in
          console.log('👤 User signed in:', session.user.email);
          errorLogger.info(ErrorCategory.GENERAL, `User signed in: ${session.user.email}`);

          // Try to sync user to database in background (non-blocking)
          try {
            const { syncUserToDatabaseClient } = await import('@/lib/supabase-client-operations');
            await syncUserToDatabaseClient(session.user, client);
            errorLogger.info(ErrorCategory.GENERAL, 'Background user sync successful');
          } catch (syncError) {
            errorLogger.warning(
              ErrorCategory.GENERAL,
              'Background user sync failed (auth still valid)',
              syncError
            );
            // Don't fail the auth flow for this
          }
        } else if (event === 'TOKEN_REFRESHED') {
          errorLogger.info(
            ErrorCategory.GENERAL,
            `Token refreshed for user: ${session?.user?.email}`
          );
        }
      });

      return () => {
        subscription.unsubscribe();
        clearTimeout(globalTimeout);
        isMounted = false;
      };
    } catch (error) {
      console.error('❌ Error initializing Supabase:', error);
      errorLogger.error(ErrorCategory.GENERAL, 'Error initializing Supabase', error);
      if (isMounted) {
        setIsConfigured(false);
        setLoading(false);
        setUser(null);
      }
      clearTimeout(globalTimeout);
    }

    return () => {
      clearTimeout(globalTimeout);
      isMounted = false;
    };
  }, []);

  // Emergency fallback - force loading to false after 8 seconds no matter what
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Emergency timeout: forcing loading to false');
        setLoading(false);
      }
    }, 8000);

    return () => clearTimeout(emergencyTimeout);
  }, [loading]);

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
        errorLogger.error(ErrorCategory.GENERAL, 'Sign out error', error);
      } else {
        setUser(null);
      }
    } catch (error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Sign out error', error);
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
      errorLogger.info(ErrorCategory.GENERAL, `GitHub OAuth redirect URL: ${redirectTo}`);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
        },
      });
      if (error) {
        errorLogger.error(ErrorCategory.GENERAL, 'GitHub sign in error', error);
        setLoading(false);
        throw error;
      }
    } catch (error) {
      errorLogger.error(ErrorCategory.GENERAL, 'GitHub sign in error', error);
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
    } catch (error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Email sign in error', error);
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
    } catch (error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Email sign up error', error);
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
    } catch (error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Reset password error', error);
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signOut,
    signInWithGitHub,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
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
