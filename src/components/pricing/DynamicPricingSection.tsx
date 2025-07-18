import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PolarProduct {
  id: string;
  name: string;
  description?: string;
  prices: PolarPrice[];
  is_archived: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface PolarPrice {
  id: string;
  amount_type: 'fixed' | 'free' | 'custom';
  type: 'one_time' | 'recurring';
  recurring_interval?: 'month' | 'year';
  price_amount?: number;
  price_currency?: string;
}

const formatPrice = (price: PolarPrice): string => {
  if (price.amount_type === 'free') return 'Free';
  if (price.amount_type === 'custom') return 'Custom';
  if (!price.price_amount) return 'Contact Us';
  
  const amount = price.price_amount / 100; // Convert from cents
  const currency = price.price_currency || 'USD';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const getRecurringText = (price: PolarPrice): string => {
  if (price.type === 'one_time') return '';
  if (price.recurring_interval === 'month') return '/month';
  if (price.recurring_interval === 'year') return '/year';
  return '';
};

const getPopularPlan = (products: PolarProduct[]): string | null => {
  // Logic to determine which plan should be marked as popular
  // Could be based on product metadata, name matching, or configuration
  const professionalPlan = products.find(p => 
    p.name.toLowerCase().includes('professional') || 
    p.name.toLowerCase().includes('pro')
  );
  return professionalPlan?.id || null;
};

const getProductFeatures = (product: PolarProduct): string[] => {
  // In a real implementation, features would come from product metadata
  // For now, we'll provide defaults based on product name
  const name = product.name.toLowerCase();
  
  if (name.includes('starter') || name.includes('free')) {
    return [
      "5 AI-generated websites",
      "Basic templates library", 
      "Standard hosting",
      "Email support"
    ];
  }
  
  if (name.includes('professional') || name.includes('pro')) {
    return [
      "Unlimited websites",
      "Premium templates",
      "Custom domain support", 
      "Priority support",
      "Advanced AI prompts",
      "Analytics dashboard"
    ];
  }
  
  if (name.includes('enterprise')) {
    return [
      "White-label solution",
      "Custom integrations",
      "Dedicated support team",
      "Advanced security", 
      "Custom AI training",
      "SLA guarantee"
    ];
  }
  
  return [
    "AI-powered features",
    "Cloud hosting",
    "Email support"
  ];
};

const PricingTier = ({
  product,
  isPopular,
  index,
  onSelectPlan,
  isLoading,
}: {
  product: PolarProduct;
  isPopular?: boolean;
  index: number;
  onSelectPlan: (priceId: string) => void;
  isLoading: boolean;
}) => {
  const primaryPrice = product.prices[0]; // Use first price as primary
  const features = getProductFeatures(product);
  
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
          <ul className="space-y-3 mb-8 flex-grow">
            {features.map((feature, featureIndex) => (
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
              onClick={() => onSelectPlan(primaryPrice.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Get Started'
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
  const { user } = useAuth();
  
  // Query products from Polar API via TRPC
  const { data: products, isLoading: isLoadingProducts, error } = useQuery({
    queryKey: ['polar-products'],
    queryFn: async () => {
      // For now, return mock data until TRPC integration is complete
      const mockProducts: PolarProduct[] = [
        {
          id: 'starter',
          name: 'Starter',
          description: 'Perfect for solo founders getting started',
          prices: [{
            id: 'price-starter',
            amount_type: 'free',
            type: 'recurring',
            recurring_interval: 'month',
          }],
          is_archived: false,
          organization_id: 'org-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'professional',
          name: 'Professional',
          description: 'Advanced features for growing startups',
          prices: [{
            id: 'price-professional',
            amount_type: 'fixed',
            type: 'recurring',
            recurring_interval: 'month',
            price_amount: 4900, // $49.00 in cents
            price_currency: 'USD',
          }],
          is_archived: false,
          organization_id: 'org-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: 'Custom solutions for large organizations',
          prices: [{
            id: 'price-enterprise',
            amount_type: 'custom',
            type: 'recurring',
            recurring_interval: 'month',
          }],
          is_archived: false,
          organization_id: 'org-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      return mockProducts;
    },
  });

  const createCheckoutSession = async (priceId: string) => {
    if (!user) {
      // Redirect to auth if not logged in
      window.location.href = '/auth';
      return;
    }

    setIsLoading(true);
    try {
      // This would use TRPC to create checkout session
      // const result = await trpc.polar.createCheckoutSession.mutate({ priceId });
      // window.location.href = result.url;
      
      // For now, just show an alert
      alert(`Creating checkout session for price: ${priceId}`);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    console.error('Error loading products:', error);
  }

  const activeProducts = products?.filter(p => !p.is_archived) || [];
  const popularPlanId = activeProducts.length > 0 ? getPopularPlan(activeProducts) : null;

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

      {isLoadingProducts ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-400">Loading pricing plans...</span>
        </div>
      ) : activeProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No pricing plans available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activeProducts.map((product, index) => (
            <PricingTier
              key={product.id}
              product={product}
              isPopular={product.id === popularPlanId}
              index={index}
              onSelectPlan={createCheckoutSession}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}; 