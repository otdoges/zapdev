'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader, Code2, Zap, Wifi } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  type?: 'webcontainer' | 'server' | 'static' | 'general';
  showProgress?: boolean;
  progress?: number;
}

export function LoadingFallback({ 
  message = 'Loading...', 
  type = 'general',
  showProgress = false,
  progress = 0
}: LoadingFallbackProps) {
  const getIcon = () => {
    switch (type) {
      case 'webcontainer':
        return <Code2 className="h-8 w-8 text-blue-500" />;
      case 'server':
        return <Zap className="h-8 w-8 text-green-500" />;
      case 'static':
        return <Wifi className="h-8 w-8 text-yellow-500" />;
      default:
        return <Loader className="h-8 w-8 animate-spin text-blue-500" />;
    }
  };

  const getTypeMessage = () => {
    switch (type) {
      case 'webcontainer':
        return 'Initializing WebContainer environment...';
      case 'server':
        return 'Connecting to server fallback...';
      case 'static':
        return 'Generating static preview...';
      default:
        return message;
    }
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-charcoal to-charcoal/90">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: type === 'general' ? 360 : 0,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.5, repeat: Infinity }
          }}
          className="mx-auto mb-6"
        >
          {getIcon()}
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-2 text-lg font-semibold text-off-white"
        >
          {getTypeMessage()}
        </motion.h3>

        {message !== getTypeMessage() && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-off-white/60"
          >
            {message}
          </motion.p>
        )}

        {showProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 w-full max-w-xs"
          >
            <div className="mb-2 text-xs text-off-white/60">
              {Math.round(progress)}%
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-deep-violet to-warm-pink"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex items-center justify-center gap-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1 w-1 rounded-full bg-deep-violet"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// Optimized skeleton loader for lists/cards
export function SkeletonLoader({ 
  lines = 3, 
  className = "" 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded bg-gradient-to-r from-white/10 to-white/5 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

// Error boundary fallback
export function ErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void; 
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-red-900/20 to-charcoal">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mx-auto mb-6 text-red-500"
        >
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </motion.div>

        <h3 className="mb-2 text-lg font-semibold text-red-500">
          Something went wrong
        </h3>
        
        <p className="mb-4 text-sm text-red-300">
          {error.message}
        </p>

        <button
          onClick={resetError}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      </motion.div>
    </div>
  );
}

// Performance-optimized image loader
export function ImageLoader({ 
  src, 
  alt, 
  className = "",
  fallback 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  fallback?: string;
}) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className={`relative ${className}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/10 to-white/5 rounded" />
      )}
      
      <img
        src={hasError && fallback ? fallback : src}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        loading="lazy"
      />
    </div>
  );
} 