'use client';

import { useEffect, useRef } from 'react';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export function ChunkErrorHandler() {
  const refreshCountRef = useRef(0);
  const lastRefreshTimeRef = useRef(0);

  useEffect(() => {
    // Simple chunk error handler that forces a page reload
    const handleChunkError = () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;

      // Prevent infinite refresh loops by limiting refreshes
      if (refreshCountRef.current >= 3) {
        errorLogger.warning(
          ErrorCategory.GENERAL,
          'Too many chunk error refreshes, stopping to prevent infinite loop'
        );
        return;
      }

      // Don't refresh if we just refreshed within the last 10 seconds
      if (timeSinceLastRefresh < 10000) {
        errorLogger.warning(
          ErrorCategory.GENERAL,
          'Chunk error detected but too soon since last refresh, skipping'
        );
        return;
      }

      errorLogger.warning(ErrorCategory.GENERAL, 'Chunk loading error detected, reloading page...');
      refreshCountRef.current++;
      lastRefreshTimeRef.current = now;

      // Force a hard refresh to get latest chunks
      const currentUrl = window.location.href.split('?')[0];
      window.location.href = currentUrl + '?t=' + Date.now();
    };

    // Handle script/chunk loading errors - but be more specific
    const handleError = (event: Event) => {
      const target = event.target as any;
      if (target && target.tagName === 'SCRIPT') {
        const src = target.src || '';
        // Only trigger for actual Next.js chunk files, not all scripts
        if (src.includes('/_next/static/chunks/') && src.includes('.js')) {
          handleChunkError();
        }
      }
    };

    // Handle JavaScript errors - be more specific about chunk loading errors
    const handleJSError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (
        (message.includes('Loading chunk') && message.includes('failed')) ||
        message.includes('ChunkLoadError')
      ) {
        handleChunkError();
      }
    };

    // Handle promise rejections from dynamic imports
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason?.message?.includes('Loading chunk') || reason?.name === 'ChunkLoadError') {
        event.preventDefault();
        handleChunkError();
      }
    };

    // Add event listeners
    window.addEventListener('error', handleError, true);
    window.addEventListener('error', handleJSError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('error', handleJSError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
