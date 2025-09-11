"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton } from "@clerk/nextjs";
import { hasClerkKeys, useSafeUser } from "@/lib/safe-clerk-hooks";

export default function ChatHistory() {
  const { isSignedIn } = useSafeUser();

  const enabled = hasClerkKeys() && isSignedIn;

  if (!hasClerkKeys()) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <section className="container px-16 mt-24">
        <div className="rounded-20 border border-border-faint bg-white p-20 text-center">
          <h3 className="text-title-medium mb-6">Your recent projects</h3>
          <p className="text-body-medium text-black-alpha-64 mb-10">
            Sign in to view and continue your projects.
          </p>
          <SignInButton mode="modal">
            <button className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              Sign In
            </button>
          </SignInButton>
        </div>
      </section>
    );
  }

  return <ChatHistoryList />;
}

function ChatHistoryList() {
  const data = useQuery(api.chats.getUserChats, { limit: 10 });

  return (
    <section className="container px-16 mt-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-title-medium">Your recent projects</h3>
        <Link href="/generation" className="text-label-medium text-blue-600 hover:underline">
          New project
        </Link>
      </div>

      {!data && (
        <div className="rounded-20 border border-border-faint bg-white p-20 text-center text-body-medium text-black-alpha-64">
          Loading your projects...
        </div>
      )}

      {data && data.chats && data.chats.length === 0 && (
        <div className="rounded-20 border border-border-faint bg-white p-20 text-center">
          <p className="text-body-medium text-black-alpha-64 mb-4">No projects yet</p>
          <Link
            href="/generation"
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start your first project
          </Link>
        </div>
      )}

      {data && data.chats && data.chats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {data.chats.map((chat: any) => (
            <div key={chat._id} className="rounded-16 overflow-hidden border border-border-faint bg-white">
              {chat.screenshot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={chat.screenshot} alt={chat.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-black-alpha-32 text-label-large">
                  No preview
                </div>
              )}
              <div className="p-14">
                <div className="text-label-large font-medium mb-2 truncate" title={chat.title}>
                  {chat.title}
                </div>
                <div className="text-label-small text-black-alpha-48 mb-4">
                  Updated {new Date(chat.updatedAt).toLocaleString()}
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    href={chat.sandboxId ? `/generation?sandbox=${encodeURIComponent(chat.sandboxId)}` : "/generation"}
                    className="text-label-medium text-blue-600 hover:underline"
                  >
                    Continue
                  </Link>
                  {chat.sandboxUrl && (
                    <a
                      href={chat.sandboxUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-label-medium text-black-alpha-64 hover:text-black"
                    >
                      Open preview
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
