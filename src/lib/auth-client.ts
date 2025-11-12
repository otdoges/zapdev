"use client";

import { createAuthClient } from "better-auth/react";

const getAuthBaseURL = () => {
  let url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Ensure protocol is present
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
