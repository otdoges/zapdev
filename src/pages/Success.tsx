import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SubscriptionData } from '@/lib/stripe';

export default function Success() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const syncSubscription = async () => {
      if (!isLoaded || !isSignedIn) {
        setError('Please sign in to view subscription details');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Get the Clerk session token
        const token = await getToken();
        if (!token) {
          throw new Error('Failed to get authentication token');
        }
        
        // Call backend to sync subscription data immediately after success
        const response = await fetch('/api/sync-after-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to sync subscription data');
        }

        const data = await response.json();
        setSubscriptionData(data);
        
      } catch (err) {
        console.error('Error syncing subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded) {
      if (sessionId) {
        syncSubscription();
      } else {
        setError('No session ID found in URL');
        setIsLoading(false);
      }
    }
  }, [sessionId, isLoaded, isSignedIn, getToken]);

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-lg font-semibold mb-2">Initializing...</h2>
              <p className="text-gray-600">Please wait while we load your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show sign in prompt if not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-lg font-semibold mb-2">Sign In Required</h2>
              <p className="text-gray-600 mb-4">Please sign in to view your subscription details.</p>
              <Button 
                onClick={() => window.location.href = '/sign-in'}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-lg font-semibold mb-2">Processing your subscription...</h2>
              <p className="text-gray-600">Please wait while we confirm your payment and set up your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold mb-2 text-red-600">Something went wrong</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.href = '/pricing'}
                variant="outline"
              >
                Back to Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Thank you for your subscription! Your payment has been processed successfully.
            </p>
            
            {subscriptionData && subscriptionData.status !== 'error' && (
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <h3 className="font-semibold mb-2">Subscription Details:</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Status:</span> {subscriptionData.status}</p>
                  {subscriptionData.currentPeriodEnd && (
                    <p>
                      <span className="font-medium">Next billing:</span>{' '}
                      {new Date(subscriptionData.currentPeriodEnd * 1000).toLocaleDateString()}
                    </p>
                  )}
                  {subscriptionData.paymentMethod && (
                    <p>
                      <span className="font-medium">Payment method:</span>{' '}
                      **** **** **** {subscriptionData.paymentMethod.last4} ({subscriptionData.paymentMethod.brand})
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 