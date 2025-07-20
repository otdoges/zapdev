import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
  priceId: string;
  planName: string;
  className?: string;
  disabled?: boolean;
}

export function SubscribeButton({ 
  priceId, 
  planName, 
  className = "", 
  disabled = false 
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      alert('Please sign in to subscribe');
      return;
    }

    try {
      setIsLoading(true);

      // Get the Clerk session token
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      // Call your backend API to create checkout session
      const response = await fetch('/api/generate-stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`Failed to start checkout process: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
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
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating checkout...
        </>
      ) : (
        `Subscribe to ${planName}`
      )}
    </Button>
  );
} 