'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  User, 
  CreditCard, 
  Users,
  X,
  Check,
  ChevronDown,
  Palette,
  Github,
  Gauge
} from 'lucide-react';

interface EnhancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  theme: 'light' | 'boring' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    usageTracking: boolean;
  };
}

export default function EnhancedSettingsModal({ isOpen, onClose }: EnhancedSettingsModalProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'workspace' | 'billing' | 'account' | 'integrations'>('workspace');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    notifications: {
      email: true,
      push: false,
      marketing: false,
    },
    privacy: {
      analytics: true,
      crashReporting: true,
      usageTracking: true,
    }
  });

  const plans = [
    {
      name: 'Pro',
      description: 'Designed for fast-moving teams building together in real time.',
      monthlyPrice: 25,
      annualPrice: 20,
      popular: true,
      features: [
        '100 monthly credits',
        '5 daily credits (up to 150/month)',
        'Private projects',
        'User roles & permissions',
        'Custom domains',
        'Remove the Lovable badge'
      ]
    },
    {
      name: 'Business', 
      description: 'Advanced controls and power features for growing departments',
      monthlyPrice: 50,
      annualPrice: 40,
      features: [
        'All features in Pro, plus:',
        '100 monthly credits',
        'SSO',
        'Personal Projects',
        'Opt out of data training',
        'Design templates',
        'Custom design systems'
      ]
    },
    {
      name: 'Enterprise',
      description: 'Built for large orgs needing flexibility, scale, and governance.',
      isEnterprise: true,
      features: [
        'Everything in Business, plus:',
        'Dedicated support',
        'Onboarding services', 
        'Custom integrations',
        'Group-based access control',
        'Custom design systems'
      ]
    }
  ];

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'boring' | 'system') => {
    updateSetting('theme', newTheme);
    
    // Apply the theme immediately
    if (newTheme === 'boring') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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
          className="bg-gray-900 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-white">Plans & Billing</h2>
              <p className="text-gray-400 mt-1">
                You're currently on plan: <strong>Free</strong>. Manage your payment preferences and view past invoices, or change your plan below.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  o
                </div>
                <div>
                  <div className="text-white font-medium">otdoges's Lovable</div>
                </div>
              </div>

              <nav className="space-y-1">
                {[
                  { id: 'workspace', label: 'Workspace', icon: Settings },
                  { id: 'account', label: 'Your Account', icon: User },
                  { id: 'billing', label: 'Plans & Billing', icon: CreditCard },
                  { id: 'integrations', label: 'Integrations', icon: Github }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                      activeTab === id
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Account</div>
                <nav className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                    People
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
              {activeTab === 'workspace' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">Workspace Settings</h3>
                    
                    {/* Theme Settings */}
                    <div className="mb-8">
                      <label className="block text-lg font-medium text-white mb-4">
                        <Palette className="w-5 h-5 inline mr-2" />
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'light', label: 'Light', desc: 'Light theme' },
                          { id: 'boring', label: 'Boring Mode', desc: 'Dark gray theme' },
                          { id: 'system', label: 'System', desc: 'Use system preference' }
                        ].map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id as any)}
                            className={`p-4 border rounded-lg text-left transition-colors ${
                              settings.theme === theme.id
                                ? 'border-blue-500 bg-blue-500 bg-opacity-10 text-white'
                                : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
                            }`}
                          >
                            <div className="font-medium">{theme.label}</div>
                            <div className="text-sm text-gray-400">{theme.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-white mb-4">Notifications</h4>
                      <div className="space-y-4">
                        {Object.entries(settings.notifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <h5 className="text-white font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </h5>
                              <p className="text-gray-400 text-sm">
                                {key === 'email' && 'Receive email notifications about your account'}
                                {key === 'push' && 'Get push notifications in your browser'}  
                                {key === 'marketing' && 'Receive marketing emails and product updates'}
                              </p>
                            </div>
                            <ToggleSwitch 
                              enabled={value} 
                              onChange={() => updateSetting(`notifications.${key}`, !value)} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Privacy */}
                    <div>
                      <h4 className="text-lg font-medium text-white mb-4">Privacy</h4>
                      <div className="space-y-4">
                        {Object.entries(settings.privacy).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <h5 className="text-white font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </h5>
                              <p className="text-gray-400 text-sm">
                                {key === 'analytics' && 'Help improve our product with usage analytics'}
                                {key === 'crashReporting' && 'Automatically send crash reports'}  
                                {key === 'usageTracking' && 'Track feature usage for improvements'}
                              </p>
                            </div>
                            <ToggleSwitch 
                              enabled={value} 
                              onChange={() => updateSetting(`privacy.${key}`, !value)} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Plans & Billing</h3>
                    <p className="text-gray-400 mb-8">
                      You're currently on plan: <strong>Free</strong>. Manage your payment preferences and view past invoices, or change your plan below.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center gap-4 mb-8">
                      <span className="text-white">Annual</span>
                      <button
                        onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          billingPeriod === 'annual' ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-white">Monthly</span>
                      {billingPeriod === 'annual' && (
                        <span className="text-green-400 text-sm">Save 20%</span>
                      )}
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid lg:grid-cols-3 gap-6 mb-8">
                      {plans.map((plan) => (
                        <div
                          key={plan.name}
                          className={`bg-gray-800 rounded-lg p-6 border-2 transition-colors ${
                            plan.popular ? 'border-blue-500' : 'border-gray-700'
                          }`}
                        >
                          {plan.popular && (
                            <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium mb-4 inline-block">
                              Most Popular
                            </div>
                          )}
                          
                          <div className="mb-4">
                            <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                            <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                            
                            {plan.isEnterprise ? (
                              <div className="mb-4">
                                <span className="text-gray-400">Flexible billing</span>
                              </div>
                            ) : (
                              <div className="mb-4">
                                <span className="text-3xl font-bold text-white">
                                  ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                                </span>
                                <span className="text-gray-400"> per month</span>
                                {billingPeriod === 'annual' && (
                                  <div className="text-sm text-green-400">
                                    Billed annually
                                  </div>
                                )}
                              </div>
                            )}

                            {!plan.isEnterprise && (
                              <div className="mb-4">
                                <button className="flex items-center gap-2 text-white bg-gray-700 px-3 py-2 rounded">
                                  <span>100 credits / month</span>
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            <Button
                              className={`w-full mb-4 ${
                                plan.popular
                                  ? 'bg-blue-600 hover:bg-blue-700'
                                  : plan.isEnterprise
                                  ? 'bg-gray-700 hover:bg-gray-600'
                                  : 'bg-gray-700 hover:bg-gray-600'
                              }`}
                            >
                              {plan.isEnterprise ? 'Book a demo' : 'Upgrade'}
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className={`text-sm ${
                                  feature.includes('All features') || feature.includes('Everything')
                                    ? 'text-gray-300 font-medium' 
                                    : 'text-gray-400'
                                }`}>
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">Your Account</h3>
                    
                    {/* User Info */}
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || 'U'}
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold text-white">
                            {user?.fullName || 'User'}
                          </h4>
                          <p className="text-gray-400">
                            {user?.emailAddresses[0]?.emailAddress}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                          Free Plan
                        </span>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Edit Profile
                        </Button>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div className="space-y-4">
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        Change Password
                      </Button>
                      <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        Download Data
                      </Button>
                      <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-900 hover:bg-opacity-20">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">Integrations</h3>
                    
                    <div className="bg-gray-800 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Github className="w-8 h-8 text-white" />
                          <div>
                            <h4 className="text-lg font-medium text-white">GitHub</h4>
                            <p className="text-gray-400 text-sm">Connect your GitHub account</p>
                          </div>
                        </div>
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Connect
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Gauge className="w-8 h-8 text-white" />
                          <div>
                            <h4 className="text-lg font-medium text-white">Supabase</h4>
                            <p className="text-gray-400 text-sm">Database integration</p>
                          </div>
                        </div>
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}