"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";

interface BackgroundAgentSwitchProps {
  className?: string;
}

export function BackgroundAgentSwitch({ className = "" }: BackgroundAgentSwitchProps) {
  const { user } = useUser();
  const userId = user?.id || "";
  
  const subscription = useQuery(api.billing.getUserSubscription, 
    user ? { userId } : "skip"
  );
  
  const backgroundAgentSettings = useQuery(api.backgroundAgents.getSettings,
    user ? { userId } : "skip"
  );
  
  const updateSettings = useMutation(api.backgroundAgents.updateSettings);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  
  const subscriptionLoaded = subscription !== undefined;
  const settingsLoaded = backgroundAgentSettings !== undefined;

  const isPro =
    subscriptionLoaded &&
    (subscription?.planType === "pro" || subscription?.planType === "enterprise");
  const isEnabled = backgroundAgentSettings?.enabled ?? false;
  const isInteractive = subscriptionLoaded && settingsLoaded;
  
  const handleToggle = async () => {
    if (!user || !subscriptionLoaded || !settingsLoaded) {
      toast.error("Please sign in to use this feature");
      return;
    }
    
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      await updateSettings({
        userId,
        enabled: !isEnabled,
      });
      
      toast.success(
        !isEnabled 
          ? "Background agent activated! 🚀" 
          : "Background agent deactivated"
      );
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">AI Agent</span>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={isLoading || !isInteractive}
          className={`
            relative w-14 h-7 rounded-full transition-all duration-300 ease-in-out
            ${isEnabled && isPro 
              ? 'bg-gradient-to-r from-orange-500 to-pink-500' 
              : 'bg-gray-200'
            }
            ${!isInteractive ? 'cursor-not-allowed opacity-50' : isPro ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}
            ${isLoading ? 'opacity-50' : ''}
            shadow-sm hover:shadow-md
          `}
        >
          <motion.div
            className={`
              absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md
              flex items-center justify-center
            `}
            animate={{
              x: isEnabled && isPro ? 28 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
            ) : !isPro ? (
              <Lock className="w-3 h-3 text-gray-400" />
            ) : (
              <div 
                className={`
                  w-2 h-2 rounded-full transition-colors duration-300
                  ${isEnabled ? 'bg-orange-500' : 'bg-gray-400'}
                `}
              />
            )}
          </motion.div>
        </button>
        
        {!isPro && (
          <span className="text-xs text-gray-500 font-medium">PRO</span>
        )}
      </div>
      
      {/* Pro Modal */}
      <AnimatePresence>
        {showProModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowProModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Upgrade to Pro
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Background AI agents are a Pro feature. Upgrade now to let AI work for you automatically!
                </p>
                
                <div className="space-y-3">
                  <a
                    href="/pricing"
                    className="block w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                  >
                    View Plans
                  </a>
                  
                  <button
                    onClick={() => setShowProModal(false)}
                    className="block w-full py-3 px-4 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
