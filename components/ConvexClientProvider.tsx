'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProvider } from 'convex/react'

// Validate Convex URL with helpful error message
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    `❌ SETUP ERROR: Missing NEXT_PUBLIC_CONVEX_URL environment variable.

To fix this:
1. Create a .env.local file in your project root
2. Add: NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
3. Get your URL by running: bunx convex dev
4. Restart your development server

For more details, see ENV-SETUP.md`
  );
}

const convex = new ConvexReactClient(convexUrl)

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
} 