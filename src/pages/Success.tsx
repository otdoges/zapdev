import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type SyncStatus = 'loading' | 'success' | 'error';

interface SyncResult {
  success: boolean;
  userId?: string;
  planId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export default function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  
  const sessionId = searchParams.get('session_id');
  const isCheckout = searchParams.get('checkout') === 'success';

  useEffect(() => {
    let canceled = false;

    const syncSubscription = async () => {
      try {
        // Add userId to the request body if available from localStorage
        const storedUserId = localStorage.getItem('convexUserId');
        const requestBody = storedUserId ? { userId: storedUserId } : {};

        const response = await fetch('/api/success', { 
          method: 'POST', 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const result: SyncResult = await response.json();

        if (canceled) return;

        if (!response.ok) {
          setSyncStatus('error');
          setSyncResult(result);
          
          if (response.status === 401) {
            toast.error('Please sign in to complete your subscription setup.');
          } else {
            toast.error(result.error || 'Unable to complete subscription setup.');
          }
          return;
        }

        setSyncStatus('success');
        setSyncResult(result);

        // Show success message
        const planName = result.planId === 'pro' ? 'Pro' : result.planId === 'enterprise' ? 'Enterprise' : 'Free';
        toast.success(`Welcome to ZapDev ${planName}! Your subscription is now active.`);

        // Clean up localStorage
        try {
          localStorage.removeItem('checkout-info');
        } catch {
          // Ignore storage errors
        }

        // Redirect after a short delay to show the success state
        setTimeout(() => {
          if (!canceled) {
            navigate('/chat', { replace: true });
          }
        }, 2000);

      } catch (error) {
        if (canceled) return;
        
        console.error('Sync error:', error);
        setSyncStatus('error');
        setSyncResult({ 
          success: false, 
          error: 'Network error. Please check your connection and try again.' 
        });
        toast.error('Network error. Please try again.');
      }
    };

    syncSubscription();

    return () => {
      canceled = true;
    };
  }, [navigate, sessionId]);

  const handleRetry = () => {
    setSyncStatus('loading');
    setSyncResult(null);
    // Reload the component logic
    window.location.reload();
  };

  const handleGoToChat = () => {
    navigate('/chat', { replace: true });
  };

  const handleGoToPricing = () => {
    navigate('/pricing', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-[#0A0A0A] border-gray-800 max-w-md w-full">
          <CardContent className="p-8 text-center">
            {syncStatus === 'loading' && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="flex justify-center mb-6"
                >
                  <Loader2 className="w-16 h-16 text-blue-500" />
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-4">
                  Setting up your subscription...
                </h1>
                <p className="text-gray-400 mb-6">
                  We're activating your account and preparing your AI-powered development environment.
                </p>
              </>
            )}

            {syncStatus === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex justify-center mb-6"
                >
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-4">
                  Welcome to ZapDev {syncResult?.planId === 'pro' ? 'Pro' : syncResult?.planId === 'enterprise' ? 'Enterprise' : ''}!
                </h1>
                <p className="text-gray-400 mb-6">
                  Your subscription is now active. You'll be redirected to the chat interface in a moment.
                </p>
                <Button 
                  onClick={handleGoToChat}
                  className="button-gradient w-full"
                >
                  Start Building Now
                </Button>
              </>
            )}

            {syncStatus === 'error' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex justify-center mb-6"
                >
                  <XCircle className="w-16 h-16 text-red-500" />
                </motion.div>
                <h1 className="text-2xl font-bold text-white mb-4">
                  Setup Incomplete
                </h1>
                <p className="text-gray-400 mb-6">
                  {syncResult?.error || 'We encountered an issue setting up your subscription. Please try again or contact support.'}
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={handleRetry}
                    className="button-gradient w-full"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={handleGoToPricing}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Back to Pricing
                  </Button>
                </div>
              </>
            )}

            {isCheckout && sessionId && (
              <p className="text-xs text-gray-500 mt-4">
                Session ID: {sessionId.slice(0, 8)}...
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


