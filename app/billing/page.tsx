'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SubscriptionPlans from '@/components/stripe/SubscriptionPlans';
import { Settings, ExternalLink, CreditCard } from 'lucide-react';

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handleCustomerPortal = async () => {
    setIsPortalLoading(true);
    
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Customer portal error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in required</h1>
          <p className="text-gray-600 mb-8">Please sign in to access billing settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Billing & Subscription
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your subscription, view billing history, and upgrade your plan
          </p>
        </div>

        {/* User Info & Customer Portal */}
        <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-200 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-600">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            <Button
              onClick={handleCustomerPortal}
              disabled={isPortalLoading}
              variant="outline"
              className="flex items-center"
            >
              {isPortalLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              {isPortalLoading ? 'Loading...' : 'Manage Subscription'}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Subscription Status (placeholder - you'd fetch this from your database) */}
        <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-200 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Current Plan
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-2">
              You are currently on the <strong>Free</strong> plan
            </p>
            <p className="text-gray-500 text-xs">
              Upgrade to unlock premium features and increase your limits
            </p>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-gray-600">
              Select the plan that best fits your needs. Upgrade or downgrade at any time.
            </p>
          </div>
          
          <SubscriptionPlans />
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I change my plan at any time?
              </h4>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be prorated 
                and reflected in your next billing cycle.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express, Discover) 
                through our secure Stripe payment processor.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Is there a refund policy?
              </h4>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, 
                contact our support team for a full refund.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                How secure is my payment information?
              </h4>
              <p className="text-gray-600">
                We never store your payment information on our servers. All payments are processed 
                securely by Stripe, which is PCI DSS compliant and trusted by millions of businesses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}