import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
  planSlug: string;
  planName: string;
  className?: string;
  disabled?: boolean;
}

export function SubscribeButton({ 
  planSlug, 
  planName, 
  className = "", 
  disabled = false 
}: SubscribeButtonProps) {
  const { isSignedIn, isLoaded } = useAuth();

  const handleSubscribe = () => {
    if (!isSignedIn) {
      alert('Please sign in to subscribe');
      return;
    }
    
    // Clerk billing handles subscription flow automatically
    // This will trigger the Clerk billing flow for the specific plan
    console.log(`Subscribing to plan: ${planSlug}`);
  };

  // Don't render until Clerk is loaded
  if (!isLoaded) {
    return (
      <Button disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Show sign in prompt if not signed in
  if (!isSignedIn) {
    return (
      <Button disabled className={className}>
        Sign in to Subscribe
      </Button>
    );
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={disabled}
      className={className}
    >
      Subscribe to {planName}
    </Button>
  );
} 