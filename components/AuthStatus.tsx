"use client";

import { useAuth } from "@workos-inc/authkit-react";
import Button from "@/components/ui/shadcn/button";

export default function AuthStatus() {
  const { user, isLoading, signInUrl, signUpUrl, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user.firstName?.[0] || user.email[0].toUpperCase()}
          </div>
          <span className="text-sm text-gray-700">
            {user.firstName || user.email}
          </span>
        </div>
        <Button
          variant="tertiary"
          onClick={() => signOut()}
          className="text-xs px-3 py-1"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="tertiary"
        onClick={() => window.location.href = signInUrl}
        className="text-xs px-3 py-1"
      >
        Sign In
      </Button>
      <Button
        variant="primary"
        onClick={() => window.location.href = signUpUrl}
        className="text-xs px-3 py-1"
      >
        Sign Up
      </Button>
    </div>
  );
}