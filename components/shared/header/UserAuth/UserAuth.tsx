"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { User } from 'lucide-react';

export default function UserAuth() {
  return (
    <div className="flex items-center gap-4">
      <SignedOut>
        <SignInButton mode="modal">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
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