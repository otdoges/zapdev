'use client';

import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
}

export default function PricingModal({ isOpen, onClose, onUpgrade }: PricingModalProps) {
  if (!isOpen) return null;

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for getting started.',
      price: 0,
      features: [
        '5 chats',
        'Basic models'
      ]
    },
    {
      name: 'Pro',
      description: 'Unlimited chats and advanced models.',
      price: 20,
      popular: true,
      features: [
        'Unlimited chats',
        'Advanced models'
      ]
    }
  ];

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
          className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
              <p className="text-gray-400 mt-1">You've reached the free plan limit of 5 chats.</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
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
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-gray-400"> per month</span>
                    </div>
                    <Button
                      onClick={() => plan.name === 'Pro' ? onUpgrade('pro') : onClose()}
                      className={`w-full ${
                        plan.name === 'Free'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {plan.name === 'Free' ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-gray-700 text-center">
            <p className="text-gray-400 text-sm">Cancel anytime.</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
