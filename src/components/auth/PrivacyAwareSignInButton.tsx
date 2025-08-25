/**
 * Privacy-Aware SignIn Button
 * 
 * A wrapper around Clerk's SignInButton that shows privacy consent during signup.
 * Uses modal mode for better UX and integrates seamlessly with the existing flow.
 */

import React, { useState } from 'react';
import { SignInButton, useClerk } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import PrivacyConsentBanner from '../PrivacyConsentBanner';

interface PrivacyAwareSignInButtonProps {
  children: React.ReactNode;
  mode?: 'modal' | 'redirect';
  forceRedirectUrl?: string;
  fallbackRedirectUrl?: string;
  signUpForceRedirectUrl?: string;
  signUpFallbackRedirectUrl?: string;
}

export function PrivacyAwareSignInButton({
  children,
  mode = 'modal',
  forceRedirectUrl,
  fallbackRedirectUrl,
  signUpForceRedirectUrl,
  signUpFallbackRedirectUrl,
}: PrivacyAwareSignInButtonProps) {
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const { openSignIn, openSignUp } = useClerk();

  const handleSignInClick = () => {
    if (mode === 'modal') {
      // Show privacy consent first for new users
      setShowPrivacyConsent(true);
    }
  };

  const handlePrivacyConsentComplete = (hasConsent: boolean) => {
    setShowPrivacyConsent(false);
    
    // Open Clerk modal with enhanced styling
    openSignIn({
      redirectUrl: forceRedirectUrl,
      fallbackRedirectUrl: fallbackRedirectUrl,
      appearance: {
        elements: {
          modalContent: 'bg-gray-900 border border-gray-700',
          modalCloseButton: 'text-gray-400 hover:text-white',
          card: 'bg-gray-900 border border-gray-700',
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          formFieldInput: 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-400',
          formFieldLabel: 'text-gray-300',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-300',
          socialButtonsBlockButton: 'bg-gray-800 border-gray-600 hover:bg-gray-700',
          socialButtonsBlockButtonText: 'text-white',
          dividerText: 'text-gray-400',
          formFieldSuccessText: 'text-green-400',
          formFieldErrorText: 'text-red-400',
          identityPreviewText: 'text-gray-300',
          identityPreviewEditButton: 'text-blue-400 hover:text-blue-300',
          footer: 'bg-gray-800/50',
          footerActionText: 'text-gray-400',
          footerActionLink: 'text-blue-400 hover:text-blue-300'
        },
        variables: {
          colorPrimary: '#3B82F6',
          colorBackground: '#111827',
          colorInputBackground: '#1F2937',
          colorInputText: '#FFFFFF',
          colorText: '#FFFFFF',
          colorTextSecondary: '#D1D5DB'
        }
      }
    });
  };


  const handlePrivacyConsentClose = () => {
    setShowPrivacyConsent(false);
  };

  // If using redirect mode, use original SignInButton
  if (mode === 'redirect') {
    return (
      <SignInButton 
        mode={mode}
        forceRedirectUrl={forceRedirectUrl}
        fallbackRedirectUrl={fallbackRedirectUrl}
        signUpForceRedirectUrl={signUpForceRedirectUrl}
        signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
      >
        {children}
      </SignInButton>
    );
  }

  // For modal mode, handle privacy consent first
  return (
    <>
      <motion.div
        onClick={handleSignInClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ cursor: 'pointer' }}
      >
        {children}
      </motion.div>
      
      {showPrivacyConsent && (
        <PrivacyConsentBanner
          onConsentChange={handlePrivacyConsentComplete}
        />
      )}
    </>
  );
}

export default PrivacyAwareSignInButton;