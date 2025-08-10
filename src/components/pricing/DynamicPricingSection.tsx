import { motion } from "framer-motion";
import { Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  STRIPE_PLANS as BILLING_PLANS,
  useStripeSubscription as useUserSubscription,
  canUserPerformStripeAction as canUserPerformAction,
  formatStripePrice as formatPrice,
  type StripePlan as ClerkPlan,
} from '@/lib/stripe-billing';

const PricingTier = ({
  plan,
  isPopular,
  index,
  onSelectPlan,
  isLoading,
  currentPlanId,
}: {
  plan: ClerkPlan;
  isPopular?: boolean;
  index: number;
  onSelectPlan: (planId: string) => void;
  isLoading: boolean;
  currentPlanId?: string;
}) => {
  const isCurrentPlan = currentPlanId === plan.id;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ 
        scale: 1.05, 
        y: -10,
        transition: { duration: 0.3 }
      }}
      className="h-full"
    >
      <CardSpotlight className={`h-full ${isPopular ? "border-primary" : "border-white/10"} border-2`}>
        <div className="relative h-full p-6 flex flex-col">
          {isPopular && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.2 }}
              className="flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1 w-fit mb-4"
            >
              <Star className="w-3 h-3" />
              Most Popular
            </motion.span>
          )}
          
          {isCurrentPlan && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.2 }}
              className="text-xs font-medium bg-green-500/10 text-green-500 rounded-full px-3 py-1 w-fit mb-4"
            >
              Current Plan
            </motion.span>
          )}
          
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
            className="text-xl font-medium mb-2"
          >
            {plan.name}
          </motion.h3>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
            className="mb-4"
          >
            <span className="text-4xl font-bold">
              {formatPrice(plan)}
            </span>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 + index * 0.2 }}
            className="text-gray-400 mb-6"
          >
            {plan.description}
          </motion.p>
          
          <ul className="space-y-3 mb-8 flex-grow">
            {plan.features.map((feature, featureIndex) => (
              <motion.li 
                key={featureIndex}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.2 + featureIndex * 0.1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-gray-300">{feature}</span>
              </motion.li>
            ))}
          </ul>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 + index * 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className={`w-full ${
                isCurrentPlan 
                  ? "bg-green-500/20 text-green-500 border-green-500/30" 
                  : "button-gradient"
              }`}
              onClick={() => onSelectPlan(plan.id)}
              disabled={isLoading || isCurrentPlan}
              variant={isCurrentPlan ? "outline" : "default"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : isCurrentPlan ? (
                'Current Plan'
              ) : plan.price === 0 ? (
                'Get Started Free'
              ) : (
                `Upgrade to ${plan.name}`
              )}
            </Button>
          </motion.div>
        </div>
      </CardSpotlight>
    </motion.div>
  );
};

export const DynamicPricingSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const { user } = useAuth();
  // Persist convex user id for success redirect sync
  useEffect(() => {
    if (user?._id) {
      try {
        localStorage.setItem('convexUserId', user._id);
      } catch (error) {
        // Optionally log error or ignore
      }
    }
  }, [user?._id]);

  const { subscription, loading: subscriptionLoading } = useUserSubscription();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('canceled') === 'true') {
        setBannerMessage('Checkout was canceled. No charges were made.');
        // clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete('canceled');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // no-op
    }
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      // Redirect to login with return URL to continue checkout
      const returnUrl = encodeURIComponent(`/pricing?planId=${planId}`);
      window.location.href = `/auth/sign-in?redirect_url=${returnUrl}`;
      return;
    }

    // If user is trying to select their current plan, do nothing
    if (subscription?.planId === planId) {
      return;
    }

    // If selecting free plan and user has a paid plan, redirect to billing portal
    if (planId === 'free' && subscription?.planId !== 'free') {
      try {
        const { createStripePortal } = await import('@/lib/stripe-billing');
        const { url } = await createStripePortal();
        window.location.href = url;
      } catch (error) {
        console.error('Error opening customer portal:', error);
        alert('Failed to open billing portal. Please try again.');
      }
      return;
    }

    setIsLoading(true);
    try {
      const { createStripeCheckout } = await import('@/lib/stripe-billing');
      const { url } = await createStripeCheckout(planId as 'pro' | 'enterprise');
      window.location.href = url;
    } catch (err) {
      console.error('Failed to start checkout', err);
      alert(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlanId = subscription?.planId || 'free';
  const popularPlanId = BILLING_PLANS.find(p => p.popular)?.id || 'pro';

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="container px-4 py-24"
    >
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-2xl mx-auto text-center mb-12"
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-5xl md:text-6xl font-normal mb-6"
        >
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Choose Your{" "}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-gradient font-medium"
          >
            Development Plan
          </motion.span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-lg text-gray-400"
        >
            Select the perfect plan for your AI-powered development needs with secure Stripe billing
        </motion.p>
      </motion.div>

      {bannerMessage && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="rounded-md border border-yellow-600/30 bg-yellow-500/10 text-yellow-300 px-4 py-3 text-sm">
            {bannerMessage}
          </div>
        </div>
      )}

      {subscriptionLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-400">Loading your subscription...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {BILLING_PLANS.map((plan, index) => (
            <PricingTier
              key={plan.id}
              plan={plan}
              isPopular={plan.id === popularPlanId}
              index={index}
              onSelectPlan={handleSelectPlan}
              isLoading={isLoading}
              currentPlanId={currentPlanId}
            />
          ))}
        </div>
      )}

      {/* Usage Information for Current Users */}
      {user && subscription && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-400">
            Current Plan: <span className="text-white font-medium">{BILLING_PLANS.find(p => p.id === currentPlanId)?.name}</span>
            {subscription.status === 'active' && subscription.planId !== 'free' && (
              <span className="ml-2">
                • Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            )}
          </p>
        </motion.div>
      )}
    </motion.section>
  );
};

export default DynamicPricingSection;