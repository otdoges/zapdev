'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
}

export default function PricingModal({ isOpen, onClose, onUpgrade }: PricingModalProps) {
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Pro',
      description: 'Designed for fast-moving teams building together in real time.',
      monthlyPrice: 25,
      annualPrice: 20,
      features: [
        'Unlimited chats',
        'Advanced AI models',
        'Priority support',
        'Export conversations',
        'Custom integrations',
        'Team collaboration'
      ]
    },
    {
      name: 'Business',
      description: 'Advanced controls and power features for growing departments',
      monthlyPrice: 50,
      annualPrice: 40,
      features: [
        'Everything in Pro, plus:',
        'Advanced analytics',
        'Custom AI training',
        'API access',
        'SSO integration',
        'Advanced security'
      ]
    },
    {
      name: 'Enterprise',
      description: 'Built for large orgs needing flexibility, scale, and governance.',
      isEnterprise: true,
      features: [
        'Everything in Business, plus:',
        'Dedicated support',
        'Custom deployment',
        'Advanced compliance',
        'Custom integrations',
        'SLA guarantees'
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
                <p className="text-gray-400 mt-1">You've reached your free plan limit of 5 chats</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center gap-4 mt-6">
              <span className="text-white">Monthly</span>
              <button
                onClick={() => setSelectedBilling(selectedBilling === 'monthly' ? 'annual' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  selectedBilling === 'annual' ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    selectedBilling === 'annual' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-white">Annual</span>
              {selectedBilling === 'annual' && (
                <span className="text-green-400 text-sm">Save 20%</span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-gray-800 rounded-lg p-6 border-2 transition-colors ${
                    plan.name === 'Pro' ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    
                    {plan.isEnterprise ? (
                      <div className="mb-4">
                        <span className="text-gray-400">Flexible billing</span>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-white">
                          ${selectedBilling === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                        </span>
                        <span className="text-gray-400"> per month</span>
                        {selectedBilling === 'annual' && (
                          <div className="text-sm text-green-400">
                            Billed annually
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => onUpgrade(plan.name.toLowerCase())}
                      className={`w-full ${
                        plan.name === 'Pro'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : plan.isEnterprise
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {plan.isEnterprise ? 'Contact Sales' : 'Upgrade'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${feature.includes('Everything') ? 'text-gray-300 font-medium' : 'text-gray-400'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 text-center">
            <p className="text-gray-400 text-sm">
              All plans include a 7-day free trial. Cancel anytime.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}