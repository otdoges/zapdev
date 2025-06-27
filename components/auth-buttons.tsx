'use client';

import { useSupabase } from '@/components/SupabaseProvider';
import { Button } from '@/components/ui/button';
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
        <Button
          variant="ghost"
          onClick={handleSignOut}
          disabled={isLoading}
          className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        onClick={() => (window.location.href = '/auth')}
        className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        Login
      </Button>
      <Button
        onClick={() => (window.location.href = '/auth')}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        Sign Up
      </Button>
    </div>
  );
}
