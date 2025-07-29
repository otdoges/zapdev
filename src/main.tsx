import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { PostHogProvider } from 'posthog-js/react'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { convex } from './lib/convex'
import App from './App.tsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <PostHogProvider
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
          options={{
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            // Removed invalid 'defaults' property to fix type error
            capture_exceptions: true,
            debug: import.meta.env.MODE === 'development',
          }}
        >
          <App />
        </PostHogProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>
);