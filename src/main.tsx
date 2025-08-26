import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { convex } from './lib/convex'
import App from './App.tsx'
import './index.css'
// Simple error logging in development
if (import.meta.env.MODE === 'development') {
  console.log('🚀 ZapDev starting in development mode');
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  console.warn("⚠️  Missing Clerk Publishable Key - Authentication will be disabled");
  console.log("💡 To enable authentication:");
  console.log("   1. Get a Clerk key from: https://dashboard.clerk.com");
  console.log("   2. Add VITE_CLERK_PUBLISHABLE_KEY=pk_test_... to .env.local");
  console.log("   3. Restart the development server");
}

const root = createRoot(document.getElementById('root')!);

// Fallback component when authentication is not configured
const UnauthenticatedApp = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
    <div className="max-w-md w-full space-y-6 text-center">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">ZapDev AI Platform</h1>
        <p className="text-slate-300 text-lg">Authentication Setup Required</p>
      </div>
      
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 space-y-4 text-left">
        <h2 className="text-xl font-semibold text-white">Quick Setup:</h2>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p className="text-white font-medium">Get Clerk API Key</p>
              <p>Visit <code className="bg-slate-700 px-1 rounded">dashboard.clerk.com</code></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p className="text-white font-medium">Get Convex URL</p>
              <p>Visit <code className="bg-slate-700 px-1 rounded">dashboard.convex.dev</code></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p className="text-white font-medium">Update .env.local</p>
              <code className="block bg-slate-700 p-2 rounded mt-1 text-xs">
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...<br/>
VITE_CONVEX_URL=https://your-app.convex.cloud
              </code>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => window.location.reload()} 
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Refresh After Setup
      </button>
    </div>
  </div>
);

root.render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/chat"
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ) : (
      <UnauthenticatedApp />
    )}
  </StrictMode>
);