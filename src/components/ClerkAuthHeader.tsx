import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";

export default function ClerkAuthHeader() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="text-xl font-bold">Your App</div>
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}