import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';
import { AUTH_TIMEOUTS } from '@/lib/auth-constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  // Enhanced methods
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: any }>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  isConfigured: false,
  signOut: async () => {},
  signInWithGitHub: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  refreshSession: async () => {},
  clearError: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof createBrowserClient> | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced error handling
  const handleError = useCallback((error: any, context: string) => {
    const errorMessage = error?.message || `Authentication error in ${context}`;
    setError(errorMessage);
    errorLogger.error(ErrorCategory.AUTH, `AuthProvider ${context}:`, error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Automatic session refresh
  const refreshSession = useCallback(async () => {
    if (!supabase || !isConfigured) return;

    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        handleError(error, 'session refresh');
      } else if (data.user) {
        setUser(data.user);
        errorLogger.info(ErrorCategory.AUTH, 'Session refreshed successfully');
      }
    } catch (error) {
      handleError(error, 'session refresh');
    }
  }, [supabase, isConfigured, handleError]);

  // Initialize Supabase client with enhanced error handling and retry logic
  useEffect(() => {
    let isMounted = true;
    let refreshTimer: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Environment validation
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (
          !supabaseUrl ||
          !supabaseAnonKey ||
          supabaseUrl === 'https://placeholder.supabase.co' ||
          supabaseAnonKey === 'placeholder-key'
        ) {
          errorLogger.warning(
            ErrorCategory.AUTH,
            'Supabase environment variables are missing or using placeholders'
          );
          if (isMounted) {
            setIsConfigured(false);
            setLoading(false);
            setError('Authentication service not configured');
          }
          return;
        }

        // Create Supabase client with enhanced configuration
        const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
          },
          global: {
            headers: {
              'X-Client-Info': 'zapdev-enhanced-auth',
            },
          },
        });

        if (!isMounted) return;

        setSupabase(client);
        setIsConfigured(true);

        // Get initial session with timeout
        const sessionPromise = client.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), AUTH_TIMEOUTS.SESSION_CHECK_TIMEOUT)
        );

        try {
          const { data: { session }, error } = await Promise.race([
            sessionPromise,
            timeoutPromise,
          ]) as any;

          if (error) {
            handleError(error, 'initial session');
          } else if (isMounted) {
            setUser(session?.user ?? null);
            if (session?.user) {
              errorLogger.info(ErrorCategory.AUTH, 'User session restored:', session.user.email);
            }
          }
        } catch (timeoutError) {
          handleError(timeoutError, 'session timeout');
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }

        // Enhanced auth state listener
        const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
          if (!isMounted) return;

          errorLogger.info(ErrorCategory.AUTH, 'Auth state changed:', { 
            event, 
            userEmail: session?.user?.email,
            expiresAt: session?.expires_at 
          });

          setUser(session?.user ?? null);
          setLoading(false);
          clearError(); // Clear errors on successful auth changes

          // Handle auth events with enhanced logic
          switch (event) {
            case 'SIGNED_OUT':
              errorLogger.info(ErrorCategory.AUTH, 'User signed out');
              // Clear any cached data
              break;

            case 'SIGNED_IN':
              if (session?.user) {
                errorLogger.info(ErrorCategory.AUTH, 'User signed in:', session.user.email);
                setRetryCount(0); // Reset retry count on successful sign in

                // Background user sync (non-blocking)
                try {
                  const { syncUserToDatabaseClient } = await import('@/lib/supabase-client-operations');
                  await syncUserToDatabaseClient(session.user, client);
                  errorLogger.info(ErrorCategory.AUTH, 'User sync successful');
                } catch (syncError) {
                  errorLogger.warning(ErrorCategory.AUTH, 'User sync failed:', syncError);
                }
              }
              break;

            case 'TOKEN_REFRESHED':
              errorLogger.info(ErrorCategory.AUTH, 'Token refreshed for:', session?.user?.email);
              break;

            case 'PASSWORD_RECOVERY':
              errorLogger.info(ErrorCategory.AUTH, 'Password recovery initiated');
              break;

            default:
              errorLogger.info(ErrorCategory.AUTH, 'Unhandled auth event:', event);
          }
        });

        // Set up automatic token refresh
        refreshTimer = setInterval(() => {
          if (isMounted && user) {
            refreshSession();
          }
        }, AUTH_TIMEOUTS.TOKEN_REFRESH_INTERVAL);

        return () => {
          subscription.unsubscribe();
          if (refreshTimer) clearInterval(refreshTimer);
          isMounted = false;
        };
      } catch (error) {
        handleError(error, 'initialization');
        if (isMounted) {
          setIsConfigured(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [handleError, refreshSession, user, clearError]);

  // Enhanced authentication methods with retry logic
  const signOut = useCallback(async () => {
    if (!supabase || !isConfigured) {
      handleError(new Error('Supabase not initialized'), 'signOut');
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        handleError(error, 'signOut');
      } else {
        setUser(null);
        errorLogger.info(ErrorCategory.AUTH, 'User signed out successfully');
      }
    } catch (error) {
      handleError(error, 'signOut');
    } finally {
      setLoading(false);
    }
  }, [supabase, isConfigured, handleError, clearError]);

  const signInWithGitHub = useCallback(async () => {
    if (!supabase || !isConfigured) {
      throw new Error('Supabase not initialized');
    }

    try {
      setLoading(true);
      clearError();
      
      const redirectTo = `${window.location.origin}/auth/callback?next=/chat`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        handleError(error, 'GitHub OAuth');
        setLoading(false);
        throw error;
      }
    } catch (error) {
      handleError(error, 'GitHub OAuth');
      setLoading(false);
      throw error;
    }
  }, [supabase, isConfigured, handleError, clearError]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase || !isConfigured) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      setLoading(true);
      clearError();
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        handleError(error, 'email sign in');
      } else {
        errorLogger.info(ErrorCategory.AUTH, 'Email sign in successful');
      }

      return { error };
    } catch (error) {
      handleError(error, 'email sign in');
      return { error };
    } finally {
      setLoading(false);
    }
  }, [supabase, isConfigured, handleError, clearError]);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase || !isConfigured) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      setLoading(true);
      clearError();
      
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

      if (error) {
        handleError(error, 'email sign up');
      } else {
        errorLogger.info(ErrorCategory.AUTH, 'Email sign up successful');
      }

      return { error };
    } catch (error) {
      handleError(error, 'email sign up');
      return { error };
    } finally {
      setLoading(false);
    }
  }, [supabase, isConfigured, handleError, clearError]);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase || !isConfigured) {
      return { error: new Error('Supabase not initialized') };
    }

    try {
      clearError();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });

      if (error) {
        handleError(error, 'password reset');
      } else {
        errorLogger.info(ErrorCategory.AUTH, 'Password reset email sent');
      }

      return { error };
    } catch (error) {
      handleError(error, 'password reset');
      return { error };
    }
  }, [supabase, isConfigured, handleError, clearError]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    isConfigured,
    signOut,
    signInWithGitHub,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    refreshSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Enhanced hook for authentication status
export const useAuthStatus = () => {
  const { user, loading, error } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    hasError: !!error,
    user,
    error,
  };
};

// Hook for authentication actions
export const useAuthActions = () => {
  const { 
    signOut, 
    signInWithGitHub, 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword, 
    refreshSession, 
    clearError 
  } = useAuth();
  
  return {
    signOut,
    signInWithGitHub,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    refreshSession,
    clearError,
  };
}; 