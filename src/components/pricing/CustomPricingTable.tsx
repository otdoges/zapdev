import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useAuthToken } from '@/lib/auth-token';
import * as Sentry from '@sentry/react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { trpc } from '@/lib/trpc';
import { authTokenManager } from '@/lib/auth-token';

interface PricingPlan {
  id: 'free' | 'starter' | 'pro' | 'enterprise';
  name: string;
  description: string;
  price: number;
  period: 'month' | 'year';
  features: string[];
  popular?: boolean;
  contactOnly?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    period: 'month',
    features: [
      '10 AI conversations per month',
      'Basic code execution',
      'Community support',
      'Standard response time',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For individual developers',
    price: 9,
    period: 'month',
    features: [
      '100 AI conversations per month',
      'Advanced code execution',
      'Email support',
      'Fast response time',
      'File uploads',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users and teams',
    price: 29,
    period: 'month',
    features: [
      'Unlimited AI conversations',
      'Advanced code execution',
      'Priority support',
      'Fastest response time',
      'Custom integrations',
      'Team collaboration',
      'Advanced analytics',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    price: 0,
    period: 'month',
    features: [
      'Everything in Pro',
      'Dedicated support team',
      'SLA guarantee',
      'Custom deployment',
      'Advanced security',
      'Custom billing',
      'On-premise options',
      'Contact Us for pricing, enterprise@zapdev.link',
    ],
    contactOnly: true,
  },
];

const PricingCard = ({ plan, index }: { plan: PricingPlan; index: number }) => {
  const { isSignedIn, isLoading: authLoading, user } = useAuth();
  const { getValidToken, ensureFreshTokenForTRPC } = useAuthToken();
  const { getToken } = useClerkAuth();
  const [isLoading, setIsLoading] = useState(false);
  

  // Better authentication check: user is considered authenticated if signed in to Clerk
  // even if Convex sync is still in progress
  const isUserAuthenticated = isSignedIn && !authLoading;

  const enterpriseContactEmail = import.meta.env.VITE_ENTERPRISE_CONTACT_EMAIL || 'enterprise@zapdev.link';

  const handleCheckoutWithFallback = async (planId: string, period: 'month' | 'year' = 'month') => {
    // Try tRPC first
    try {
      console.log('Attempting tRPC checkout:', { planId, period });
      
      // Ensure fresh token
      const tokenRefreshed = await ensureFreshTokenForTRPC();
      if (!tokenRefreshed) {
        throw new Error('Failed to obtain valid authentication token');
      }

      // Verify tRPC client
      if (!trpc?.billing?.createCheckoutSession) {
        throw new Error('tRPC billing client not properly initialized');
      }

      const result = await trpc.billing.createCheckoutSession.mutate({ planId, period });
      
      if (result?.url) {
        console.log('tRPC checkout successful, redirecting...');
        window.location.href = result.url;
        return true;
      }
      
      throw new Error('tRPC checkout succeeded but no URL returned');
    } catch (tRPCError) {
      console.warn('tRPC checkout failed, trying direct API fallback:', tRPCError);
      
      // Fallback to direct API call
      try {
        const token = await getValidToken();
        if (!token) {
          throw new Error('No authentication token available for API fallback');
        }

        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planId, period })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.message || `API request failed: ${response.status}`);
        }

        const data = await response.json();
        if (data?.url) {
          console.log('API fallback successful, redirecting...');
          window.location.href = data.url;
          return true;
        }
        
        throw new Error('API fallback succeeded but no URL returned');
      } catch (apiError) {
        console.error('Both tRPC and API fallback failed:', { tRPCError, apiError });
        
        // Final fallback - show helpful error message
        const errorMessage = apiError instanceof Error 
          ? apiError.message 
          : 'Unable to start checkout process';
          
        toast.error(`Checkout failed: ${errorMessage}. Please try again or contact support.`);
        
        Sentry.captureException(new Error('Complete checkout failure'), {
          tags: { feature: 'pricing', action: 'checkout_complete_failure' },
          extra: { 
            planId, 
            period,
            tRPCError: tRPCError instanceof Error ? tRPCError.message : String(tRPCError),
            apiError: apiError instanceof Error ? apiError.message : String(apiError),
            userId: user?.id,
            isAuthenticated: isUserAuthenticated
          }
        });
        
        return false;
      }
    }
  };

  const handlePlanSelect = async () => {
    if (plan.contactOnly) {
      // Open email client for enterprise plan
      window.location.href = `mailto:${enterpriseContactEmail}?subject=Enterprise Plan Inquiry&body=Hi, I'm interested in learning more about the Enterprise plan for ZapDev.`;
      return;
    }

    if (plan.id === 'free') {
      toast.info('You are already on the free plan!');
      return;
    }

    if (!isUserAuthenticated) {
      toast.error('Please sign in to upgrade your plan');
      Sentry.addBreadcrumb({
        message: 'User attempted to upgrade without authentication',
        level: 'info',
        data: { planId: plan.id, isSignedIn, authLoading, hasUser: !!user }
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the robust checkout handler with fallback mechanisms
      const success = await handleCheckoutWithFallback(plan.id, 'month');
      
      if (!success) {
        // Additional user guidance if all methods fail
        toast.error('Checkout temporarily unavailable. Please try again in a few minutes or contact support.', {
          action: {
            label: 'Contact Support',
            onClick: () => window.location.href = 'mailto:support@zapdev.link?subject=Checkout Issue'
          }
        });
      }
    } catch (error) {
      console.error('Unexpected error in handlePlanSelect:', error);
      toast.error('An unexpected error occurred. Please try again.');
      
      Sentry.captureException(error, {
        tags: { feature: 'pricing', action: 'handle_plan_select_error' },
        extra: { planId: plan.id, userId: user?.id }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price}`;
  };

  const getButtonText = () => {
    if (plan.contactOnly) return 'Contact Sales';
    if (plan.id === 'free') return 'Current Plan';
    return 'Get Started';
  };

  const getButtonIcon = () => {
    if (plan.contactOnly) return <Mail className="w-4 h-4 ml-2" />;
    return <ArrowRight className="w-4 h-4 ml-2" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className={`h-full relative ${plan.popular ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-800'} bg-[#0A0A0A] hover:border-blue-500/50 transition-all duration-300`}>
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-blue-500 text-white px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
          </div>
        )}
        
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
          <p className="text-gray-400 text-sm">{plan.description}</p>
          
          <div className="mt-4">
            {plan.contactOnly ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Custom Pricing</div>
                <div className="text-sm text-gray-400 mt-1">Contact us for details</div>
                <div className="text-xs text-blue-400 mt-2">{enterpriseContactEmail}</div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-3xl font-bold text-white">{formatPrice(plan.price)}</span>
                {plan.price > 0 && <span className="text-gray-400 text-sm">/{plan.period}</span>}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <ul className="space-y-3 flex-1">
            {plan.features.map((feature, featureIndex) => (
              <li key={featureIndex} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Button
              onClick={handlePlanSelect}
              disabled={isLoading || (plan.id === 'free')}
              className={`w-full ${
                plan.popular 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : plan.contactOnly
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
              }`}
              variant={plan.popular ? 'default' : 'outline'}
            >
              {isLoading ? 'Loading...' : getButtonText()}
              {!isLoading && getButtonIcon()}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const CustomPricingTable = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-16 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan, index) => (
            <PricingCard key={plan.id} plan={plan} index={index} />
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-sm">
            All plans include our core AI development features. Enterprise customers get dedicated support and custom solutions.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Questions about enterprise pricing? Contact us at{' '}
            <a 
              href={`mailto:${import.meta.env.VITE_ENTERPRISE_CONTACT_EMAIL || 'enterprise@zapdev.link'}`}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {import.meta.env.VITE_ENTERPRISE_CONTACT_EMAIL || 'enterprise@zapdev.link'}
            </a>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CustomPricingTable;
