"use client";

import { useAuth } from "@clerk/nextjs";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "price_pro";
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading for a better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!userId) {
    return redirect("/");
  }

  // Map plan IDs to human-readable names
  const planNames = {
    price_basic: "Basic",
    price_pro: "Pro",
    price_enterprise: "Enterprise"
  };
  
  const planName = planNames[planId as keyof typeof planNames] || "Pro";

  return (
    <div className="min-h-screen bg-[#0D0D10] text-white flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6C52A0] rounded-full filter blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#A0527C] rounded-full filter blur-[120px]" />
      </div>
      
      <motion.div 
        className="max-w-md w-full bg-[#121215] border border-[#1E1E24] rounded-xl p-8 shadow-xl relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">Subscription Successful!</h1>
        <p className="text-[#EAEAEA]/70 text-center mb-8">
          {isLoading ? (
            "Finalizing your subscription..."
          ) : (
            <>You are now subscribed to the <span className="text-[#A0527C] font-medium">{planName} Plan</span>.</>
          )}
        </p>
        
        {isLoading ? (
          <div className="flex justify-center mb-6">
            <svg className="animate-spin h-8 w-8 text-[#6C52A0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <Button 
              className="w-full py-6 rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C]"
              onClick={() => router.push("/chat")}
            >
              Go to Chat
            </Button>
            <Button 
              className="w-full py-6 rounded-full bg-[#1A1A1F] hover:bg-[#22222A] border border-[#2A2A35]"
              onClick={() => router.push("/")}
            >
              Return to Home
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
} 