"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { hasClerkKeys } from '@/lib/safe-clerk-hooks';
import { User } from 'lucide-react';

export default function UserAuth() {
  if (!hasClerkKeys()) {
    return (
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
          <User size={16} />
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <User size={16} />
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            }
          }}
        />
      </SignedIn>
    </div>
  );
}