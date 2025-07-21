import { useAuth, SignInButton } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

interface ClerkPricingTableProps {
  className?: string;
}

export function ClerkPricingTable({ className = "" }: ClerkPricingTableProps) {
  const { isSignedIn, isLoaded } = useAuth();

  // Don't render until Clerk is loaded
  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading pricing...</span>
      </div>
    );
  }

  // Show sign in prompt if not signed in
  if (!isSignedIn) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Sign in to view pricing plans</h3>
        <SignInButton mode="modal">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  // TODO: Replace with actual Clerk PricingTable component when available
  // For now, this is a placeholder that shows Clerk billing integration is ready
  return (
    <div className={`${className}`}>
      {/* This will be replaced with <PricingTable /> when Clerk billing is fully configured */}
      <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <h3 className="text-lg font-semibold mb-2">Clerk Billing Integration Ready</h3>
        <p className="text-gray-600 mb-4">
          Configure your pricing plans in the Clerk Dashboard to display them here.
        </p>
        <div className="text-sm text-gray-500">
          Once configured, this will show the Clerk &lt;PricingTable /&gt; component
        </div>
      </div>
    </div>
  );
}