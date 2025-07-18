
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "./CardSpotlight";

const PricingTier = ({
  name,
  price,
  description,
  features,
  isPopular,
  index,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  index: number;
}) => (
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
          {name}
        </motion.h3>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 + index * 0.2 }}
          className="mb-4"
        >
          <span className="text-4xl font-bold">{price}</span>
          {price !== "Custom" && <span className="text-gray-400">/month</span>}
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 + index * 0.2 }}
          className="text-gray-400 mb-6"
        >
          {description}
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
          <Button className="button-gradient w-full">
            Get Started
          </Button>
        </motion.div>
      </div>
    </CardSpotlight>
  </motion.div>
);

export const PricingSection = () => {
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
        <PricingTier
          name="Starter"
          price="$0"
          description="Perfect for solo founders getting started"
          features={[
            "5 AI-generated websites",
            "Basic templates library",
            "Standard hosting",
            "Email support"
          ]}
          index={0}
        />
        <PricingTier
          name="Professional"
          price="$49"
          description="Advanced features for growing startups"
          features={[
            "Unlimited websites",
            "Premium templates",
            "Custom domain support",
            "Priority support",
            "Advanced AI prompts",
            "Analytics dashboard"
          ]}
          isPopular
          index={1}
        />
        <PricingTier
          name="Enterprise"
          price="Custom"
          description="Custom solutions for large organizations"
          features={[
            "White-label solution",
            "Custom integrations",
            "Dedicated support team",
            "Advanced security",
            "Custom AI training",
            "SLA guarantee"
          ]}
          index={2}
        />
      </div>
    </motion.section>
  );
};
