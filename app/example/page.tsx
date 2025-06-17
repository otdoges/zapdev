"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function ExamplePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Convex + Clerk Example</h1>
      
      <AuthLoading>
        <div className="text-lg">Loading authentication state...</div>
      </AuthLoading>
      
      <Authenticated>
        <div className="flex flex-col items-center gap-4 p-6 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span>You are signed in:</span>
            <UserButton afterSignOutUrl="/" />
          </div>
          <Content />
        </div>
      </Authenticated>
      
      <Unauthenticated>
        <div className="flex flex-col items-center gap-4 p-6 bg-slate-800 rounded-lg">
          <p className="text-lg">You are not signed in.</p>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </Unauthenticated>
    </div>
  );
}

function Content() {
  // This will only be called if the user is authenticated
  const messages = useQuery(api.messages.list);
  
  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
      {messages === undefined ? (
        <p>Loading messages...</p>
      ) : messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message._id} className="p-3 bg-slate-700 rounded">
              <p>{message.content}</p>
              <p className="text-sm text-gray-400">
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 