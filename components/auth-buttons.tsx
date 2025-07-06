'use client';

import { useSupabase } from '@/components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { CrossBrowserButton } from '@/components/ui/cross-browser-button';
import { useState, useEffect } from 'react';
import { AUTH_COOKIES, hasAuthCookies } from '@/lib/auth-constants';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export function AuthButtons() {
  const { user, loading, signOut } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [cookieAuth, setCookieAuth] = useState<boolean | null>(null);

  // Quick cookie check for instant feedback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCookieAuth(hasAuthCookies(document.cookie));
    }
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setCookieAuth(false); // Update cookie state immediately
    } catch (error) {
      errorLogger.error(ErrorCategory.GENERAL, 'Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use user data if available, otherwise fall back to cookie check
  const isAuthenticated = !loading && user !== undefined ? !!user : cookieAuth;

  // Show loading placeholder only if we have no information at all
  if (loading && cookieAuth === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-16 animate-pulse rounded bg-zinc-800"></div>
        <div className="h-8 w-20 animate-pulse rounded bg-zinc-800"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-300">{user?.email || 'Authenticated'}</span>
        <CrossBrowserButton
          onClick={handleSignOut}
          disabled={isLoading}
          className="cross-browser-button text-zinc-300 hover:bg-zinc-800 hover:text-white"
          motionProps={{
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 }
          }}
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </CrossBrowserButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CrossBrowserButton
        onClick={() => (window.location.href = '/auth')}
        className="cross-browser-button text-zinc-300 hover:bg-zinc-800 hover:text-white"
        motionProps={{
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 }
        }}
      >
        Login
      </CrossBrowserButton>
      <CrossBrowserButton
        onClick={() => (window.location.href = '/auth')}
        className="cross-browser-button gradient-button-primary"
        motionProps={{
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 }
        }}
      >
        Sign Up
      </CrossBrowserButton>
    </div>
  );
}
