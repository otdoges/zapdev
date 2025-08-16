import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, Bot, Code, Sparkles, Brain, Cpu, Network, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'gradient' | 'glow';
  className?: string;
}

interface LoadingStateProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  className?: string;
}

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'avatar' | 'text' | 'button' | 'card';
  lines?: number;
  animate?: boolean;
}

interface ProgressiveLoadingProps {
  steps: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    duration?: number;
  }>;
  currentStep?: string;
  className?: string;
}

// Loading Spinner Component
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              'bg-primary rounded-full',
              size === 'xs' ? 'w-1 h-1' :
              size === 'sm' ? 'w-1.5 h-1.5' :
              size === 'md' ? 'w-2 h-2' :
              size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn(
          'bg-primary rounded-full opacity-75',
          sizeClasses[size],
          className
        )}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    );
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex items-end space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1 bg-primary rounded-full"
            style={{ height: size === 'xs' ? 8 : size === 'sm' ? 12 : size === 'md' ? 16 : size === 'lg' ? 20 : 24 }}
            animate={{
              scaleY: [1, 2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <motion.div
        className={cn(
          'relative rounded-full bg-gradient-to-r from-primary to-purple-600',
          sizeClasses[size],
          className
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-1 bg-background rounded-full" />
      </motion.div>
    );
  }

  if (variant === 'glow') {
    return (
      <motion.div
        className={cn('relative', className)}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className={cn(
          'absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-50',
          sizeClasses[size]
        )} />
        <motion.div
          className={cn(
            'relative bg-primary rounded-full',
            sizeClasses[size]
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    );
  }

  // Default spinner
  return (
    <motion.div
      className={cn(sizeClasses[size], className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 className="w-full h-full text-primary" />
    </motion.div>
  );
};

// Loading State Wrapper
export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  children,
  fallback,
  delay = 0,
  className
}) => {
  const [showLoading, setShowLoading] = React.useState(delay === 0 ? loading : false);

  React.useEffect(() => {
    if (loading && delay > 0) {
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(loading);
    }
  }, [loading, delay]);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {showLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fallback || (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner variant="glow" size="lg" />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Skeleton Component
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  lines = 1,
  animate = true
}) => {
  const baseClasses = cn(
    'bg-gradient-to-r from-muted/50 to-muted/80 rounded',
    animate && 'animate-pulse',
    className
  );

  if (variant === 'avatar') {
    return <div className={cn(baseClasses, 'w-10 h-10 rounded-full')} />;
  }

  if (variant === 'button') {
    return <div className={cn(baseClasses, 'h-10 w-24 rounded-lg')} />;
  }

  if (variant === 'card') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className={cn(baseClasses, 'h-4 w-3/4')} />
        <div className={cn(baseClasses, 'h-4 w-1/2')} />
        <div className={cn(baseClasses, 'h-20 w-full')} />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              'h-4',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    );
  }

  return <div className={cn(baseClasses, 'h-4 w-full')} />;
};

// Progressive Loading Component
export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  steps,
  currentStep,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = currentStep && steps.findIndex(s => s.id === currentStep) > index;
        
        return (
          <motion.div
            key={step.id}
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
              isCompleted && 'bg-green-500 border-green-500 text-white',
              isActive && 'border-primary bg-primary/10 text-primary',
              !isActive && !isCompleted && 'border-muted text-muted-foreground'
            )}>
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  ✓
                </motion.div>
              ) : isActive ? (
                <LoadingSpinner size="xs" variant="gradient" />
              ) : (
                step.icon || <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            
            <div className={cn(
              'flex-1 text-sm font-medium transition-colors',
              isActive && 'text-primary',
              isCompleted && 'text-green-500',
              !isActive && !isCompleted && 'text-muted-foreground'
            )}>
              {step.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Specialized Loading Components for ZapDev
export const AIThinkingLoader: React.FC<{ message?: string }> = ({
  message = "AI is thinking..."
}) => {
  const thoughts = [
    "Analyzing your request",
    "Processing context",
    "Generating response",
    "Optimizing output"
  ];

  const [currentThought, setCurrentThought] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentThought(prev => (prev + 1) % thoughts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [thoughts.length]);

  return (
    <div className="flex items-center space-x-3 p-4 glass rounded-lg">
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <Brain className="w-6 h-6 text-primary" />
        <motion.div
          className="absolute -inset-2 bg-primary/20 rounded-full blur"
          animate={{
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
      
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentThought}
            className="text-sm font-medium text-primary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {thoughts[currentThought]}
          </motion.p>
        </AnimatePresence>
        <div className="flex space-x-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-primary rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const CodeExecutionLoader: React.FC<{ language?: string }> = ({
  language = "JavaScript"
}) => {
  return (
    <div className="flex items-center space-x-3 p-4 glass rounded-lg">
      <motion.div
        className="relative"
        animate={{
          rotate: [0, 360]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        <Cpu className="w-6 h-6 text-green-500" />
        <motion.div
          className="absolute -inset-2 bg-green-500/20 rounded-full blur"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-green-500">
          Executing {language} code...
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <div className="flex-1 h-1 bg-green-500/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </div>
          <Code className="w-3 h-3 text-green-500" />
        </div>
      </div>
    </div>
  );
};

export const NetworkLoader: React.FC<{ message?: string }> = ({
  message = "Connecting..."
}) => {
  return (
    <div className="flex items-center space-x-3 p-4 glass rounded-lg">
      <motion.div
        className="relative"
      >
        <Network className="w-6 h-6 text-blue-500" />
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute -inset-2 border-2 border-blue-500/30 rounded-full"
            animate={{
              scale: [1, 2],
              opacity: [1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut'
            }}
          />
        ))}
      </motion.div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-500">{message}</p>
        <div className="flex space-x-1 mt-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 bg-blue-500/60 rounded-full"
              style={{ height: 4 + (i * 2) }}
              animate={{
                scaleY: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Page Loading Overlay
export const PageLoadingOverlay: React.FC<{
  message?: string;
  progress?: number;
}> = ({
  message = "Loading ZapDev...",
  progress
}) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-chat-bg)] backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center space-y-6">
        {/* Logo */}
        <motion.div
          className="mx-auto w-16 h-16 glass-elevated rounded-2xl flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 360],
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 3, repeat: Infinity, ease: 'linear' }
          }}
        >
          <Zap className="w-8 h-8 text-primary" />
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xl font-semibold text-gradient-static mb-2">
            {message}
          </h3>
          
          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default {
  LoadingSpinner,
  LoadingState,
  Skeleton,
  ProgressiveLoading,
  AIThinkingLoader,
  CodeExecutionLoader,
  NetworkLoader,
  PageLoadingOverlay
};