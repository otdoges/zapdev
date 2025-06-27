'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

interface VersionCheckResponse {
  currentVersion: string;
  isUpdateAvailable: boolean;
  latestVersion: string;
  updateSource: string;
  updateInfo: string;
  timestamp: string;
  error?: string;
}

export function VersionCheck() {
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      // Only check once per session to avoid spam
      if (hasChecked) return;

      try {
        // Check for test mode in URL
        const isTestMode =
          typeof window !== 'undefined' &&
          window.location.search.includes('test-version-check=true');

        // Only check for updates in production, if explicitly enabled, or in test mode
        const isProduction = process.env.NODE_ENV === 'production';
        const isEnabled = process.env.NEXT_PUBLIC_ENABLE_VERSION_CHECK === 'true';

        if (!isProduction && !isEnabled && !isTestMode) {
          return;
        }

        // Fetch version information from our API
        const response = await fetch('/api/version-check', {
          cache: 'no-store',
        });

        if (!response.ok) {
          errorLogger.warning(
            ErrorCategory.GENERAL,
            'Failed to check for updates:',
            response.status
          );
          return;
        }

        const data: VersionCheckResponse = await response.json();

        if (data.error) {
          errorLogger.warning(ErrorCategory.GENERAL, 'Version check error:', data.error);
          return;
        }

        // In test mode, force show update notification
        let shouldShowUpdate = data.isUpdateAvailable;
        let testData = data;

        if (isTestMode) {
          shouldShowUpdate = true;
          testData = {
            ...data,
            isUpdateAvailable: true,
            latestVersion: '0.2.0',
            updateSource: 'test',
            updateInfo: 'This is a test notification to demonstrate the version check system.',
          };
        }

        if (shouldShowUpdate) {
          // Check localStorage to avoid showing the same notification repeatedly (skip in test mode)
          if (!isTestMode) {
            const lastNotifiedVersion = localStorage.getItem('zapdev-last-notified-version');
            // Store based on current version + latest version combination to avoid duplicate notifications
            const notificationKey = `${testData.currentVersion}->${testData.latestVersion}`;
            const lastNotificationKey = localStorage.getItem('zapdev-last-notification-key');

            if (lastNotificationKey === notificationKey) {
              return;
            }

            // Store that we've notified about this version update
            localStorage.setItem('zapdev-last-notified-version', testData.currentVersion);
            localStorage.setItem('zapdev-last-notification-key', notificationKey);
          }

          const versionText =
            testData.latestVersion === 'newer commit'
              ? 'with newer commits'
              : `v${testData.latestVersion}`;

          toast({
            title: isTestMode ? '🧪 Test: ZapDev Update Available!' : '🚀 ZapDev Update Available!',
            description: `You're running v${testData.currentVersion}. A newer version ${versionText} is available on the master branch. ${testData.updateInfo || 'Refresh to get the latest features and improvements.'}`,
            duration: 15000, // Show for 15 seconds
            action: (
              <ToastAction
                altText="Refresh Page"
                onClick={() => {
                  // Clear the notification flags so it shows again after refresh if still outdated
                  if (!isTestMode) {
                    localStorage.removeItem('zapdev-last-notified-version');
                    localStorage.removeItem('zapdev-last-notification-key');
                  }
                  window.location.reload();
                }}
              >
                Refresh
              </ToastAction>
            ),
          });
        }

        setHasChecked(true);
      } catch (error) {
        // Silently fail for network errors
        errorLogger.warning(ErrorCategory.GENERAL, 'Error checking for updates:', error);
        setHasChecked(true);
      }
    };

    // Check for updates after a short delay to avoid blocking initial render
    const timeoutId = setTimeout(checkForUpdates, 3000);

    return () => clearTimeout(timeoutId);
  }, [hasChecked]);

  // This component doesn't render anything visible
  return null;
}
