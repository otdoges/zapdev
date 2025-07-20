import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { PostHogProvider } from 'posthog-js/react'
import { ClerkProvider } from '@clerk/clerk-react'
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
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          defaults: '2025-05-24',
          capture_exceptions: true,
          debug: import.meta.env.MODE === 'development',
        }}
      >
        <App />
      </PostHogProvider>
    </ClerkProvider>
  </StrictMode>
);