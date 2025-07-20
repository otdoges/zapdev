import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react';
import { ReactNode } from 'react';

interface ClerkProviderProps {
  children: ReactNode;
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <ClerkReactProvider publishableKey={PUBLISHABLE_KEY}>
      {children}
    </ClerkReactProvider>
  );
} 