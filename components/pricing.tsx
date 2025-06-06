"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function Pricing() {
  const router = useRouter();

  const handleSubscribe = () => {
    window.location.href = "/api/generate-stripe-checkout";
  };

  return (
    <section className="relative overflow-hidden flex flex-col items-center justify-center px-4 py-20 md:py-32 bg-[#0D0D10]">
      <motion.div
        className="relative z-10 max-w-5xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
          Unlock Your Creative Potential
        </h2>
        <p className="text-lg md:text-xl text-[#EAEAEA]/80 max-w-2xl mx-auto mb-10">
          Choose the plan that's right for you and start building beautiful
          websites with the power of AI.
        </p>

        <motion.div
          className="bg-[#121215] border border-[#1E1E24] rounded-xl p-8 max-w-md mx-auto"
          whileHover={{ scale: 1.02, boxShadow: "0px 0px 20px rgba(108, 82, 160, 0.3)" }}
        >
          <h3 className="text-3xl font-bold mb-2">Pro Plan</h3>
          <p className="text-[#EAEAEA]/70 mb-6">
            Everything you need to go from idea to deployment, faster than ever.
          </p>
          <div className="text-5xl font-bold mb-6">
            $10<span className="text-xl font-normal text-[#EAEAEA]/60">/month</span>
          </div>
          <ul className="text-left space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <CheckIcon /> Unlimited Website Generations
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon /> Access to All Frameworks
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon /> Priority Support
            </li>
          </ul>
          <Button
            className="w-full text-lg py-6 px-8 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] rounded-full"
            onClick={handleSubscribe}
          >
            Subscribe Now
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#6C52A0]"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
} 