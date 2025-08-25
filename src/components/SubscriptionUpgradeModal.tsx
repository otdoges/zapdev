import React from 'react';
import { X, Zap, CheckCircle } from 'lucide-react';
import { SafeText } from '@/components/ui/SafeText';

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title?: string;
  message?: string;
}

export const SubscriptionUpgradeModal: React.FC<SubscriptionUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  title = "Upgrade Required",
  message = "You've reached your free plan limit. Upgrade to Pro to continue using all features."
}) => {
  if (!isOpen) return null;

  const features = [
    "Unlimited AI conversations",
    "Priority support",
    "Advanced code execution",
    "Enhanced collaboration tools"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-base-200 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-base-content mb-2">{title}</h2>
          <p className="text-base-content opacity-70">{message}</p>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-base-content">Pro Plan includes:</h3>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success flex-shrink-0" />
                <SafeText className="text-sm text-base-content opacity-80">{feature}</SafeText>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn btn-ghost flex-1"
          >
            Maybe Later
          </button>
          <button
            onClick={onUpgrade}
            className="btn btn-primary flex-1"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};