"use client";

import { Authenticated, Unauthenticated, AuthLoading, useConvexAuth } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function AuthExamplePage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Convex + Clerk Authentication Example</h1>
      
      <AuthLoading>
        <div className="text-lg">Loading authentication state...</div>
      </AuthLoading>
      
      <Authenticated>
        <div className="flex flex-col items-center gap-4 p-6 bg-slate-800 rounded-lg w-full max-w-lg">
          <div className="flex items-center gap-2">
            <span>You are signed in:</span>
            <UserButton afterSignOutUrl="/auth-example" />
          </div>
          <MessagesList />
          <MessageForm />
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

function MessagesList() {
  // This will only be called if the user is authenticated
  const messages = useQuery(api.messages.list);
  
  return (
    <div className="mt-4 w-full">
      <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
      {messages === undefined ? (
        <p>Loading messages...</p>
      ) : messages.length === 0 ? (
        <p>No messages yet. Create your first message below!</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message._id} className="p-3 bg-slate-700 rounded">
              <p className="mb-1">{message.content}</p>
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

function MessageForm() {
  const [content, setContent] = useState("");
  const createMessage = useMutation(api.messages.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await createMessage({ content });
      setContent("");
    } catch (error) {
      console.error("Failed to create message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full mt-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="font-medium">
          New Message
        </label>
        <textarea
          id="message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="p-2 rounded bg-slate-900 border border-slate-700"
          rows={3}
          placeholder="Type your message here..."
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
} 