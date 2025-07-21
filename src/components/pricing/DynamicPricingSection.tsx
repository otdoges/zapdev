import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";
import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { ClerkPricingTable } from "../ClerkPricingTable";

interface ClerkPlan {
  id: string;
  name: string;
  description?: string;
  features: string[];
  price: string;
  isPopular?: boolean;
  slug: string;
}

// Hardcoded pricing plans for Clerk billing
const clerkPlans: ClerkPlan[] = [
  {
    id: '1',
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for individuals getting started',
    price: 'Free',
    features: [
      '3 AI-generated websites',
      'Basic templates',
      'Community support',
      'Standard hosting'
    ]
  },
  {
    id: '2',
    name: 'Pro',
    slug: 'pro',
    description: 'Best for growing businesses',
    price: '$29/month',
    isPopular: true,
    features: [
      'Unlimited AI websites',
      'Premium templates',
      'Priority support',
      'Custom domain',
      'Advanced analytics',
      'SEO optimization'
    ]
  },
  {
    id: '3',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For large organizations',
    price: 'Custom',
    features: [
      'Everything in Pro',
      'White-label solution',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
      'Multi-team management'
    ]
  }
];

const PricingTier = ({
  plan,
  isPopular,
  index,
  onSelectPlan,
  isLoading,
}: {
  plan: ClerkPlan;
  isPopular?: boolean;
  index: number;
  onSelectPlan: (planSlug: string) => void;
  isLoading: boolean;
}) => {
  
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
              {plan.price}
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
          
          <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((feature, featureIndex) => (
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
              onClick={() => onSelectPlan(plan.slug)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : plan.price === 'Custom' ? (
                'Contact Sales'
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
  const { isSignedIn } = useAuth();

  const handlePlanSelection = async (planSlug: string) => {
    if (!isSignedIn) {
      window.location.href = '/sign-in';
      return;
    }

    setIsLoading(true);
    try {
      // In a real Clerk billing implementation, this would trigger the billing flow
      console.log(`Selected plan: ${planSlug}`);
      
      if (planSlug === 'enterprise') {
        // Handle contact sales
        alert('Contact sales for Enterprise plan');
      } else {
        // This would normally trigger Clerk's billing flow
        alert(`Subscribing to ${planSlug} plan (Clerk billing flow would start here)`);
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Failed to select plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Use Clerk PricingTable for modern billing
  const useClerkPricingTable = true;

  if (useClerkPricingTable) {
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

        <ClerkPricingTable className="max-w-4xl mx-auto" />
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
        {clerkPlans.map((plan, index) => (
          <PricingTier
            key={plan.id}
            plan={plan}
            isPopular={plan.isPopular}
            index={index}
            onSelectPlan={handlePlanSelection}
            isLoading={isLoading}
          />
        ))}
      </div>
    </motion.section>
  );
}; 