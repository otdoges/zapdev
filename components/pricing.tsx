"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export default function Pricing() {
  const router = useRouter();
  const { data: session } = useSession();
  const isSignedIn = !!session?.user;
  const [isLoading, setIsLoading] = useState<number | null>(null);

  const handleSubscribe = async (priceId: string, tier: number) => {
    if (!isSignedIn) {
      toast.error("Please sign in to subscribe");
      return;
    }

    setIsLoading(tier);
    try {
      window.location.href = `/api/generate-stripe-checkout?priceId=${priceId}`;
    } catch (error) {
      console.error("Error initiating checkout:", error);
      toast.error("Failed to initiate checkout");
      setIsLoading(null);
    }
  };

  const plans = [
    {
      tier: 1,
      name: "Basic",
      price: "$5",
      priceId: "price_basic",
      description: "Get started with essential features",
      features: [
        "Basic Website Generations",
        "Access to Core Frameworks",
        "Standard Support",
        "7-day Trial"
      ],
      className: "bg-[#121215] border border-[#1E1E24]"
    },
    {
      tier: 2,
      name: "Pro",
      price: "$10",
      priceId: "price_pro",
      description: "Everything you need to go from idea to deployment",
      features: [
        "Unlimited Website Generations",
        "Access to All Frameworks",
        "Priority Support",
        "Custom Domains"
      ],
      className: "bg-gradient-to-b from-[#121215] to-[#15131C] border border-[#6C52A0]/30 shadow-lg shadow-[#6C52A0]/20"
    },
    {
      tier: 3,
      name: "Enterprise",
      price: "$25",
      priceId: "price_enterprise",
      description: "Advanced features for professional developers",
      features: [
        "All Pro Features",
        "Advanced Code Customization",
        "Dedicated Support",
        "Team Collaboration"
      ],
      className: "bg-[#121215] border border-[#1E1E24]"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section id="pricing" className="relative overflow-hidden flex flex-col items-center justify-center px-4 py-20 md:py-32 bg-[#0D0D10]">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6C52A0] rounded-full filter blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A0527C] rounded-full filter blur-[120px]" />
      </div>
      
      <motion.div
        className="relative z-10 max-w-7xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#6C52A0] to-[#A0527C]">
          Choose Your Plan
        </h2>
        <p className="text-lg md:text-xl text-[#EAEAEA]/80 max-w-2xl mx-auto mb-16">
          Select the perfect plan for your needs and start building beautiful
          websites with the power of AI.
        </p>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.tier}
              className={`${plan.className} rounded-xl p-8 text-left transition-all duration-300`}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0px 0px 20px rgba(108, 82, 160, 0.3)",
              }}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-[#EAEAEA]/70 mb-6 h-12">
                {plan.description}
              </p>
              <div className="text-4xl font-bold mb-6">
                {plan.price}<span className="text-xl font-normal text-[#EAEAEA]/60">/month</span>
              </div>
              <ul className="text-left space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckIcon /> {feature}
                  </li>
                ))}
              </ul>
              {isSignedIn ? (
                <Button
                  className={`w-full py-6 px-8 ${plan.tier === 2 
                    ? 'bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C]' 
                    : 'bg-[#1A1A1F] hover:bg-[#22222A] border border-[#2A2A35]'} 
                    rounded-full transition-all duration-300`}
                  onClick={() => handleSubscribe(plan.priceId, plan.tier)}
                  disabled={isLoading !== null}
                >
                  {isLoading === plan.tier ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              ) : (
                <Button
                  className={`w-full py-6 px-8 ${plan.tier === 2 
                    ? 'bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C]' 
                    : 'bg-[#1A1A1F] hover:bg-[#22222A] border border-[#2A2A35]'} 
                    rounded-full transition-all duration-300`}
                  onClick={() => router.push("/auth")}
                >
                  Sign Up to Subscribe
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
        
        <div className="mt-16 text-center">
          <p className="text-[#EAEAEA]/60 text-sm max-w-2xl mx-auto">
            All plans include secure payment processing with Stripe. 
            Need a custom plan for your team? <a href="mailto:support@zapdev.com" className="text-[#6C52A0] hover:text-[#7C62B0] underline">Contact us</a>.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6C52A0]"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
} 