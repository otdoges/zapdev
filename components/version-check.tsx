'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

export function VersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Get current version from environment variable
        const current = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';
        setCurrentVersion(current);

        // Only check for updates in production or if explicitly enabled
        if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_VERSION_CHECK !== 'true') {
          setIsLoading(false);
          return;
        }

        // Fetch latest version from GitHub API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('https://api.github.com/repos/otdoges/zapdev/releases/latest', {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          },
          // Add cache control to prevent stale data
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn('Failed to fetch latest version:', response.status, response.statusText);
          return;
        }

        const data = await response.json();
        const latest = data.tag_name?.replace(/^v/, '').trim(); // Remove 'v' prefix and trim whitespace
        
        if (latest) {
          setLatestVersion(latest);
          
          // Compare versions (simple string comparison works for semantic versioning)
          if (latest !== current) {
            setUpdateAvailable(true);
          }
        }
      } catch (error) {
        // Silently fail for network errors during development
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn('Version check timed out');
          } else {
            console.warn('Error checking for updates:', error.message);
          }
        } else {
          console.warn('Error checking for updates:', String(error));
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkForUpdates();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) return null;
  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="bg-yellow-900/80 border-yellow-700 backdrop-blur-sm">
        <AlertTitle className="text-yellow-200">Update Available</AlertTitle>
        <AlertDescription className="text-yellow-100">
          <p>You're using version {currentVersion}. The latest version is {latestVersion}.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 bg-yellow-700/30 hover:bg-yellow-700/50 border-yellow-600 text-yellow-100"
            onClick={handleRefresh}
          >
            {isLoading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Refresh to Update'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
