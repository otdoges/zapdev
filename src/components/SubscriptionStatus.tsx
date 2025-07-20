import { useAuth, useUser } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Calendar, AlertCircle } from 'lucide-react';

export function SubscriptionStatus() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user } = useUser();
  
  // Use Convex query to get subscription data directly
  const subscriptionData = useQuery(
    api.stripe.getSubscriptionByClerkUserId,
    isSignedIn && userId ? { clerkUserId: userId } : "skip"
  );

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

  if (subscriptionData === undefined) {
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

  if (!subscriptionData || subscriptionData.status === 'none') {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case 'incomplete':
        return <Badge className="bg-blue-100 text-blue-800">Incomplete</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
          <span className="font-medium">Status:</span>
          {getStatusBadge(subscriptionData.status)}
        </div>

        {subscriptionData.planName && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Plan:</span>
            <span className="text-sm">{subscriptionData.planName}</span>
          </div>
        )}

        {subscriptionData.currentPeriodEnd && (
          <div className="flex items-center justify-between">
            <span className="font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Next billing:
            </span>
            <span className="text-sm">
              {new Date(subscriptionData.currentPeriodEnd * 1000).toLocaleDateString()}
            </span>
          </div>
        )}

        {subscriptionData.paymentMethod && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Payment method:</span>
            <span className="text-sm">
              **** **** **** {subscriptionData.paymentMethod.last4} ({subscriptionData.paymentMethod.brand})
            </span>
          </div>
        )}

        {subscriptionData.cancelAtPeriodEnd && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Your subscription will be canceled at the end of the current billing period.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/billing'}
            className="flex-1"
          >
            Manage Billing
          </Button>
          {subscriptionData.status === 'active' && !subscriptionData.cancelAtPeriodEnd && (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/pricing'}
              className="flex-1"
            >
              Upgrade Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 