'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState({
    analytics: true,
    crashReporting: true,
    performanceMetrics: false,
    usageTracking: true,
    aiImprovement: true,
    marketingEmails: false,
    productUpdates: true,
    notifications: {
      desktop: true,
      email: false,
      push: true
    },
    privacy: {
      shareData: false,
      publicProfile: false,
      searchable: true
    }
  });

  const handleToggle = (key: string, subKey?: string) => {
    if (subKey) {
      setSettings(prev => ({
        ...prev,
        [key]: {
          ...prev[key as keyof typeof prev] as any,
          [subKey]: !(prev[key as keyof typeof prev] as any)[subKey]
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: !prev[key as keyof typeof prev]
      }));
    }
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

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
          className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="p-6 space-y-8">
            {/* Analytics & Data Collection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Analytics & Data Collection</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Analytics</h4>
                    <p className="text-gray-400 text-sm">Help us improve by sharing anonymous usage data</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.analytics} 
                    onChange={() => handleToggle('analytics')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Crash Reporting</h4>
                    <p className="text-gray-400 text-sm">Automatically send crash reports to help fix bugs</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.crashReporting} 
                    onChange={() => handleToggle('crashReporting')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Performance Metrics</h4>
                    <p className="text-gray-400 text-sm">Share performance data to optimize the app</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.performanceMetrics} 
                    onChange={() => handleToggle('performanceMetrics')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Usage Tracking</h4>
                    <p className="text-gray-400 text-sm">Track feature usage to improve user experience</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.usageTracking} 
                    onChange={() => handleToggle('usageTracking')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">AI Improvement</h4>
                    <p className="text-gray-400 text-sm">Use conversations to improve AI responses</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.aiImprovement} 
                    onChange={() => handleToggle('aiImprovement')} 
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Desktop Notifications</h4>
                    <p className="text-gray-400 text-sm">Get notified about important updates</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.notifications.desktop} 
                    onChange={() => handleToggle('notifications', 'desktop')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Email Notifications</h4>
                    <p className="text-gray-400 text-sm">Receive email updates and alerts</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.notifications.email} 
                    onChange={() => handleToggle('notifications', 'email')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Push Notifications</h4>
                    <p className="text-gray-400 text-sm">Get push notifications on mobile devices</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.notifications.push} 
                    onChange={() => handleToggle('notifications', 'push')} 
                  />
                </div>
              </div>
            </div>

            {/* Communications */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Communications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Marketing Emails</h4>
                    <p className="text-gray-400 text-sm">Receive promotional emails and offers</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.marketingEmails} 
                    onChange={() => handleToggle('marketingEmails')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Product Updates</h4>
                    <p className="text-gray-400 text-sm">Get notified about new features and updates</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.productUpdates} 
                    onChange={() => handleToggle('productUpdates')} 
                  />
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Share Usage Data</h4>
                    <p className="text-gray-400 text-sm">Share anonymized data with third parties</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.privacy.shareData} 
                    onChange={() => handleToggle('privacy', 'shareData')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Public Profile</h4>
                    <p className="text-gray-400 text-sm">Make your profile visible to other users</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.privacy.publicProfile} 
                    onChange={() => handleToggle('privacy', 'publicProfile')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Searchable Profile</h4>
                    <p className="text-gray-400 text-sm">Allow others to find you in search</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.privacy.searchable} 
                    onChange={() => handleToggle('privacy', 'searchable')} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}