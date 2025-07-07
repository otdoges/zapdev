'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { errorLogger, ErrorCategory } from '@/lib/error-logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error tracking service
    errorLogger.error(ErrorCategory.GENERAL, 'Application error boundary triggered', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0D10] p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-red-500 mix-blend-multiply blur-3xl filter"></div>
          <div className="animation-delay-1000 absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-orange-500 mix-blend-multiply blur-3xl filter"></div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-lg text-center"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 space-y-4"
        >
          <h1 className="text-3xl font-bold text-white">Something went wrong!</h1>
          <p className="text-lg text-[#EAEAEA]/70">
            An unexpected error occurred. Don't worry, we've been notified and are working on it.
          </p>
          <p className="text-lg text-[#EAEAEA]/70">
            Make an issue on{' '}
            <a 
              href="https://github.com/otdoges/zapdev/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#6C52A0] hover:text-[#7C62B0] underline transition-colors"
            >
              GitHub
            </a>
          </p>
          {error.digest && (
            <p className="font-mono text-sm text-[#EAEAEA]/50">Error ID: {error.digest}</p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col justify-center gap-4 sm:flex-row"
        >
          <Button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C52A0] to-[#A0527C] px-6 py-3 text-white hover:from-[#7C62B0] hover:to-[#B0627C]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-xl border-[#EAEAEA]/20 px-6 py-3 text-white hover:border-[#EAEAEA]/30"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </motion.div>

        {/* Dev Mode Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-12 rounded-lg bg-[#1A1A1F] p-4 text-left"
          >
            <p className="mb-2 text-sm text-[#EAEAEA]/50">Development Error Details:</p>
            <pre className="max-h-40 overflow-auto text-xs text-red-400">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </motion.div>
        )}
      </motion.div>

      {/* CSS for animations */}
      <style jsx>{`
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
