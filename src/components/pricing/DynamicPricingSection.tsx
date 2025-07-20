import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  features: string[];
  tier: string;
  isPopular: boolean;
  order: number;
  prices: Array<{
    id: string;
    amount?: number;
    currency: string;
    type: string;
    recurring?: {
      interval: string;
      intervalCount: number;
    };
  }>;
  primaryPrice: {
    id: string;
    amount?: number;
    currency: string;
    type: string;
    recurring?: {
      interval: string;
      intervalCount: number;
    };
  } | null;
}

const formatPrice = (price: StripeProduct['primaryPrice']): string => {
  if (!price) return 'Custom';
  if (!price.amount) return 'Free';
  
  const amount = price.amount / 100; // Convert from cents
  const currency = price.currency.toUpperCase();
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const getRecurringText = (price: StripeProduct['primaryPrice']): string => {
  if (!price?.recurring) return '';
  
  const { interval, intervalCount } = price.recurring;
  
  if (intervalCount === 1) {
    return `/${interval}`;
  } else {
    return `/${intervalCount} ${interval}s`;
  }
};

const PricingTier = ({
  product,
  isPopular,
  index,
  onSelectPlan,
  isLoading,
}: {
  product: StripeProduct;
  isPopular?: boolean;
  index: number;
  onSelectPlan: (priceId: string) => void;
  isLoading: boolean;
}) => {
  const primaryPrice = product.primaryPrice;
  
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
        <div className="flex flex-col h-full p-8">
          {isPopular && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.2 }}
              className="text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1 w-fit mb-4"
            >
              Most Popular
            </motion.span>
          )}
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
            className="text-xl font-medium mb-2"
          >
            {product.name}
          </motion.h3>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
            className="mb-4"
          >
            <span className="text-4xl font-bold">
              {formatPrice(primaryPrice)}
            </span>
            <span className="text-gray-400">
              {getRecurringText(primaryPrice)}
            </span>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 + index * 0.2 }}
            className="text-gray-400 mb-6"
          >
            {product.description || `Perfect for ${product.name.toLowerCase()} users`}
          </motion.p>
          
          <ul className="space-y-3 mb-8 flex-1">
            {product.features.map((feature, featureIndex) => (
              <motion.li 
                key={featureIndex}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.2 + featureIndex * 0.1 }}
                className="flex items-center gap-2"
              >
                <Check className="w-5 h-5 text-primary" />
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
              className="button-gradient w-full"
              onClick={() => primaryPrice && onSelectPlan(primaryPrice.id)}
              disabled={isLoading || !primaryPrice}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : primaryPrice ? (
                'Get Started'
              ) : (
                'Contact Sales'
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
  const { isSignedIn, getToken } = useAuth();
  
  // Query pricing data from Convex (sourced from Stripe)
  const pricingData = useQuery(api.stripe.getPricingData);

  const createCheckoutSession = async (priceId: string) => {
    if (!isSignedIn) {
      // Redirect to sign in
      window.location.href = '/sign-in';
      return;
    }

    setIsLoading(true);
    try {
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
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loading and error states
  if (pricingData === undefined) {
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
              Building Plan
            </motion.span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-lg text-gray-400"
          >
            Select the perfect plan to build your startup's website with AI-powered tools
          </motion.p>
        </motion.div>

        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-400">Loading pricing plans...</span>
        </div>
      </motion.section>
    );
  }

  if (!pricingData || pricingData.length === 0) {
    return (
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
        className="container px-4 py-24"
      >
        <div className="text-center py-12">
          <p className="text-gray-400">No pricing plans available at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">
            Run <code className="bg-gray-800 px-2 py-1 rounded">bun run sync-pricing</code> to sync Stripe pricing data.
          </p>
        </div>
      </motion.section>
    );
  }

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
            Building Plan
          </motion.span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-lg text-gray-400"
        >
          Select the perfect plan to build your startup's website with AI-powered tools
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {pricingData.map((product, index) => (
          <PricingTier
            key={product.id}
            product={product}
            isPopular={product.isPopular}
            index={index}
            onSelectPlan={createCheckoutSession}
            isLoading={isLoading}
          />
        ))}
      </div>
    </motion.section>
  );
}; 