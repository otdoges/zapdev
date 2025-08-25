/**
 * Privacy Consent Banner Component
 * 
 * Displays a privacy consent banner when user consent is required,
 * allowing users to control their privacy preferences.
 */

import React, { useState, useEffect } from 'react';
import { Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { privacyConsent, getDefaultConsent } from '@/lib/privacy-consent';

interface PrivacyConsentBannerProps {
  onConsentChange?: (hasConsent: boolean) => void;
}

export function PrivacyConsentBanner({ onConsentChange }: PrivacyConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState(getDefaultConsent());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Show banner if consent is required
    if (privacyConsent.isConsentRequired()) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsent = {
      errorMonitoring: true,
      analytics: true,
      performance: true,
      screenshots: true,
    };
    
    privacyConsent.setConsent(allConsent);
    setIsVisible(false);
    onConsentChange?.(true);
    
    // Reload to apply new Sentry configuration
    if (allConsent.errorMonitoring) {
      window.location.reload();
    }
  };

  const handleAcceptSelected = () => {
    privacyConsent.setConsent(preferences);
    setIsVisible(false);
    onConsentChange?.(preferences.errorMonitoring || preferences.analytics || preferences.performance || preferences.screenshots);
    
    // Reload to apply new Sentry configuration if error monitoring was enabled
    if (preferences.errorMonitoring) {
      window.location.reload();
    }
  };

  const handleDeclineAll = () => {
    privacyConsent.setConsent(getDefaultConsent());
    setIsVisible(false);
    onConsentChange?.(false);
  };

  const updatePreference = (key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 text-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-400" />
              <div>
                <CardTitle className="text-xl">Privacy & Data Collection</CardTitle>
                <CardDescription className="text-gray-400">
                  Help us improve ZapDev while respecting your privacy
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-300 leading-relaxed">
            <p>
              We use analytics and error monitoring to improve ZapDev. You can control what data we collect.
              <strong className="text-white"> Your privacy matters to us</strong> – we never sell your data.
            </p>
          </div>

          {isExpanded && (
            <div className="space-y-4 border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Info className="w-4 h-4" />
                Choose Your Preferences
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="errorMonitoring"
                    checked={preferences.errorMonitoring}
                    onCheckedChange={(checked) => updatePreference('errorMonitoring', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="errorMonitoring" className="font-medium text-white cursor-pointer">
                      Error Monitoring & Diagnostics
                    </label>
                    <p className="text-sm text-gray-400 mt-1">
                      Helps us detect and fix bugs. May include error details and user actions leading to errors.
                      <span className="text-orange-400"> Note: This may include some personal information.</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="analytics"
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => updatePreference('analytics', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="analytics" className="font-medium text-white cursor-pointer">
                      Usage Analytics
                    </label>
                    <p className="text-sm text-gray-400 mt-1">
                      Anonymous data about how you use ZapDev to improve features and user experience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="performance"
                    checked={preferences.performance}
                    onCheckedChange={(checked) => updatePreference('performance', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="performance" className="font-medium text-white cursor-pointer">
                      Performance Monitoring
                    </label>
                    <p className="text-sm text-gray-400 mt-1">
                      Monitor app performance to identify and fix slow operations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="screenshots"
                    checked={preferences.screenshots}
                    onCheckedChange={(checked) => updatePreference('screenshots', checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="screenshots" className="font-medium text-white cursor-pointer">
                      Feedback Screenshots
                    </label>
                    <p className="text-sm text-gray-400 mt-1">
                      Allow screenshot capture when providing feedback to help us understand issues.
                      <span className="text-orange-400"> Screenshots may contain personal information.</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong>Privacy Note:</strong> You can change these preferences anytime in Settings.
                  We implement additional safeguards to protect your data regardless of your choices.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {!isExpanded && (
              <Button
                onClick={() => setIsExpanded(true)}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-800"
              >
                Customize Privacy Settings
              </Button>
            )}
            
            <div className="flex gap-3">
              {isExpanded ? (
                <>
                  <Button
                    onClick={handleAcceptSelected}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Preferences
                  </Button>
                  <Button
                    onClick={handleDeclineAll}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    Decline All
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Accept All
                  </Button>
                  <Button
                    onClick={handleDeclineAll}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    Decline All
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center">
            By continuing, you agree to our{' '}
            <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">
              Terms of Service
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PrivacyConsentBanner;