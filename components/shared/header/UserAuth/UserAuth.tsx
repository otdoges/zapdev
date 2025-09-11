"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { hasClerkKeys } from '@/lib/safe-clerk-hooks';
import { User } from 'lucide-react';

export default function UserAuth() {
  if (!hasClerkKeys()) {
    return (
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md shadow-sm transition-colors">
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
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md shadow-sm transition-colors">
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