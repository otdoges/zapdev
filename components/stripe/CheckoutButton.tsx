'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getStripe } from '@/lib/stripe-client';
import { Loader2, CreditCard } from 'lucide-react';

interface CheckoutButtonProps {
  priceId?: string;
  mode?: 'payment' | 'subscription';
  quantity?: number;
  successUrl?: string;
  cancelUrl?: string;
  allowPromotionCodes?: boolean;
  customAmount?: {
    amount: number;
    currency: string;
    name: string;
    description?: string;
  };
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'code' | 'orange' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function CheckoutButton({
  priceId,
  mode = 'payment',
  quantity = 1,
  successUrl,
  cancelUrl,
  allowPromotionCodes = true,
  customAmount,
  variant = 'default',
  size = 'default',
  className,
  children,
  disabled = false,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!priceId && !customAmount) {
      console.error('Either priceId or customAmount is required');
      return;
    }

    setIsLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          mode,
          quantity,
          successUrl,
          cancelUrl,
          allowPromotionCodes,
          customAmount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // You might want to show a toast notification here
      alert(error instanceof Error ? error.message : 'An error occurred during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Processing...' : children || 'Checkout'}
    </Button>
  );
}