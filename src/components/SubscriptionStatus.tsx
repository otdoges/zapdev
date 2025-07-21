import { useAuth, useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Calendar, AlertCircle } from 'lucide-react';

export function SubscriptionStatus() {
  const { isSignedIn, isLoaded, userId, has } = useAuth();
  const { user } = useUser();
  
  // TODO: Replace with actual Clerk billing subscription data
  // For now, we'll use a placeholder structure
  const subscriptionData = {
    status: 'none', // Will be replaced with Clerk billing status
    planName: null,
    currentPeriodEnd: null,
    paymentMethod: null,
    cancelAtPeriodEnd: false
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading subscription status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Sign in to view subscription status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if user has access to specific plans using Clerk's has() method
  const hasBasicPlan = has && has({ plan: 'basic' });
  const hasPremiumPlan = has && has({ plan: 'premium' });
  const hasProPlan = has && has({ plan: 'pro' });

  // Determine current plan based on Clerk permissions
  let currentPlan = 'None';
  if (hasProPlan) currentPlan = 'Pro';
  else if (hasPremiumPlan) currentPlan = 'Premium';
  else if (hasBasicPlan) currentPlan = 'Basic';

  if (currentPlan === 'None') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <Badge variant="outline" className="bg-gray-50">
              No Active Subscription
            </Badge>
            <p className="text-gray-600">
              You don't have an active subscription yet.
            </p>
            <Button 
              onClick={() => window.location.href = '/pricing'}
              className="w-full"
            >
              View Pricing Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPlanBadge = (plan: string) => {
    return <Badge className="bg-green-100 text-green-800">{plan}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Current Plan:</span>
          {getPlanBadge(currentPlan)}
        </div>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Billing is managed through Clerk. Access your billing portal from the user menu.
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/pricing'}
              className="flex-1"
            >
              Change Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 