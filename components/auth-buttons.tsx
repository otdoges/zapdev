"use client";

import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function AuthButtons() {
  const { user, loading, signOut } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [cookieAuth, setCookieAuth] = useState<boolean | null>(null);

  // Quick cookie check for instant feedback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authCookies = [
        'sb-access-token',
        'sb-refresh-token'
      ];
      
      const hasAuthCookie = authCookies.some(cookieName => {
        return document.cookie.split(';').some(cookie => {
          const [name, value] = cookie.trim().split('=');
          return name === cookieName && value && value !== 'undefined';
        });
      });
      
      setCookieAuth(hasAuthCookie);
    }
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      setCookieAuth(false); // Update cookie state immediately
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use user data if available, otherwise fall back to cookie check
  const isAuthenticated = !loading && user !== undefined 
    ? !!user 
    : cookieAuth;

  // Show loading placeholder only if we have no information at all
  if (loading && cookieAuth === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-8 bg-zinc-800 rounded animate-pulse"></div>
        <div className="w-20 h-8 bg-zinc-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-zinc-300 text-sm">
          {user?.email || "Authenticated"}
        </span>
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          disabled={isLoading}
          className="text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          {isLoading ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        onClick={() => window.location.href = "/auth"}
        className="text-zinc-300 hover:text-white hover:bg-zinc-800"
      >
        Login
      </Button>
      <Button 
        onClick={() => window.location.href = "/auth"}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        Sign Up
      </Button>
    </div>
  );
} 