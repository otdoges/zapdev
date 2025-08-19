import { motion } from "framer-motion";
import { CustomPricingTable } from "./CustomPricingTable";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

// Uses custom pricing table with direct Polar.sh integration

export const DynamicPricingSection = () => {
  const { user } = useAuth();
  
  // User ID persistence is now handled securely via session state
  // No need to store sensitive user data in localStorage

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="container mx-auto px-4 py-24"
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
            Select the perfect plan for your AI-powered development needs with secure Polar.sh billing
        </motion.p>
      </motion.div>

      {/* Custom PricingTable with enterprise restrictions */}
      <div className="w-full max-w-6xl mx-auto">
        <CustomPricingTable />
      </div>
    </motion.section>
  );
};

export default DynamicPricingSection;