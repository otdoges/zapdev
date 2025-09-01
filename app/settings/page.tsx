'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4"
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h1 
              className="text-4xl font-bold text-white mb-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              ⚙️ Settings
            </motion.h1>
            <motion.p 
              className="text-gray-400 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Configure your Zapdev experience
            </motion.p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500"
            >
              ← Back
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Settings Cards */}
      <motion.div 
        variants={containerVariants}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Analytics & Data Collection */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="card bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl"
        >
          <div className="card-body">
            <motion.h2 
              className="card-title text-2xl text-white mb-4"
              whileHover={{ x: 10 }}
              transition={{ duration: 0.2 }}
            >
              📊 Analytics & Data Collection
            </motion.h2>
            <div className="space-y-6">
              {[
                { key: 'analytics', title: 'Analytics', desc: 'Help us improve by sharing anonymous usage data' },
                { key: 'crashReporting', title: 'Crash Reporting', desc: 'Automatically send crash reports to help fix bugs' },
                { key: 'performanceMetrics', title: 'Performance Metrics', desc: 'Share performance data to optimize the app' },
                { key: 'usageTracking', title: 'Usage Tracking', desc: 'Track feature usage to improve user experience' },
                { key: 'aiImprovement', title: 'AI Improvement', desc: 'Use conversations to improve AI responses' }
              ].map((item, index) => (
                <motion.div
                  key={item.key}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200"
                >
                  <div>
                    <h4 className="text-white font-medium text-lg">{item.title}</h4>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Switch 
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onCheckedChange={() => handleToggle(item.key)}
                      className="toggle-lg"
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="card bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl"
        >
          <div className="card-body">
            <motion.h2 
              className="card-title text-2xl text-white mb-4"
              whileHover={{ x: 10 }}
              transition={{ duration: 0.2 }}
            >
              🔔 Notifications
            </motion.h2>
            <div className="space-y-6">
              {[
                { key: 'desktop', title: 'Desktop Notifications', desc: 'Get notified about important updates' },
                { key: 'email', title: 'Email Notifications', desc: 'Receive email updates and alerts' },
                { key: 'push', title: 'Push Notifications', desc: 'Get push notifications on mobile devices' }
              ].map((item) => (
                <motion.div
                  key={item.key}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200"
                >
                  <div>
                    <h4 className="text-white font-medium text-lg">{item.title}</h4>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Switch 
                      checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                      onCheckedChange={() => handleToggle('notifications', item.key)}
                      className="toggle-lg"
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Communications */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="card bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl"
        >
          <div className="card-body">
            <motion.h2 
              className="card-title text-2xl text-white mb-4"
              whileHover={{ x: 10 }}
              transition={{ duration: 0.2 }}
            >
              📧 Communications
            </motion.h2>
            <div className="space-y-6">
              {[
                { key: 'marketingEmails', title: 'Marketing Emails', desc: 'Receive promotional emails and offers' },
                { key: 'productUpdates', title: 'Product Updates', desc: 'Get notified about new features and updates' }
              ].map((item) => (
                <motion.div
                  key={item.key}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200"
                >
                  <div>
                    <h4 className="text-white font-medium text-lg">{item.title}</h4>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Switch 
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onCheckedChange={() => handleToggle(item.key)}
                      className="toggle-lg"
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="card bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-xl"
        >
          <div className="card-body">
            <motion.h2 
              className="card-title text-2xl text-white mb-4"
              whileHover={{ x: 10 }}
              transition={{ duration: 0.2 }}
            >
              🔒 Privacy
            </motion.h2>
            <div className="space-y-6">
              {[
                { key: 'shareData', title: 'Share Usage Data', desc: 'Share anonymized data with third parties' },
                { key: 'publicProfile', title: 'Public Profile', desc: 'Make your profile visible to other users' },
                { key: 'searchable', title: 'Searchable Profile', desc: 'Allow others to find you in search' }
              ].map((item) => (
                <motion.div
                  key={item.key}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-all duration-200"
                >
                  <div>
                    <h4 className="text-white font-medium text-lg">{item.title}</h4>
                    <p className="text-gray-400">{item.desc}</p>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Switch 
                      checked={settings.privacy[item.key as keyof typeof settings.privacy]}
                      onCheckedChange={() => handleToggle('privacy', item.key)}
                      className="toggle-lg"
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center pt-6 pb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="btn btn-primary btn-lg px-8 py-3 text-lg"
              onClick={() => {
                // Handle save logic here
                console.log('Settings saved:', settings);
                router.back();
              }}
            >
              💾 Save Changes
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}