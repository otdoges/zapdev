/**
 * Enhanced SignUp Component
 * 
 * Custom signup flow that integrates privacy consent before proceeding to Clerk authentication.
 * Provides a seamless onboarding experience with clear privacy controls.
 */

import React, { useState } from 'react';
import { SignUp, useClerk } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import PrivacyConsentBanner, { useSignupPrivacyConsent } from '../PrivacyConsentBanner';
import { Shield, Sparkles, Code, Zap } from 'lucide-react';

interface EnhancedSignUpProps {
  redirectUrl?: string;
}

export function EnhancedSignUp({ redirectUrl = '/chat' }: EnhancedSignUpProps) {
  const [step, setStep] = useState<'privacy' | 'signup' | 'welcome'>('privacy');
  const { showConsent, hasConsent, PrivacyConsentStep, closeConsent } = useSignupPrivacyConsent();
  const { openSignUp } = useClerk();

  const handlePrivacyComplete = () => {
    setStep('signup');
    closeConsent();
    // Open Clerk's signup modal after privacy consent
    openSignUp({
      redirectUrl,
      appearance: {
        elements: {
          modalContent: 'bg-gray-900 border border-gray-700',
          modalCloseButton: 'text-gray-400 hover:text-white',
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'bg-gray-900 border border-gray-700',
          formFieldInput: 'bg-gray-800 border-gray-600 text-white',
          formFieldLabel: 'text-gray-300',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-300'
        }
      }
    });
  };

  const features = [
    {
      icon: Code,
      title: 'AI-Powered Development',
      description: 'Generate, debug, and optimize code with advanced AI assistance'
    },
    {
      icon: Zap,
      title: 'Real-time Collaboration',
      description: 'Work together seamlessly with integrated chat and sharing'
    },
    {
      icon: Sparkles,
      title: 'Smart Automation',
      description: 'Automated testing, deployment, and performance optimization'
    }
  ];

  if (step === 'privacy' && showConsent) {
    return (
      <div className="relative">
        <PrivacyConsentStep />
        {/* Background content to show what's coming */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 -z-10">
          <div className="flex items-center justify-center h-full opacity-20">
            <div className="text-center space-y-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 mx-auto mb-8"
              >
                <div className="w-full h-full bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center">
                  <Zap className="w-12 h-12 text-white" />
                </div>
              </motion.div>
              
              <h1 className="text-4xl font-bold text-white mb-4">Welcome to ZapDev</h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                The AI-powered development platform that transforms how you build, collaborate, and deploy.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-full flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Once privacy consent is handled, Clerk modal will handle the rest
  return null;
}

export default EnhancedSignUp;