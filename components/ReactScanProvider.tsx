'use client';

import { useEffect } from 'react';
import { ReactScanMonitor } from '@/lib/react-scan-monitor';

export function ReactScanProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize React Scan monitoring in development
    if (process.env.NODE_ENV === 'development') {
      const monitor = ReactScanMonitor.getInstance();
      
      // Cleanup on unmount
      return () => {
        monitor.shutdown();
      };
    }
  }, []);

  return <>{children}</>;
}
