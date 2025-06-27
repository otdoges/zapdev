'use client';

import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
}

export function ThemeToggle({ className, size = 'md', variant = 'ghost' }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    // Prevent hydration mismatch by returning a placeholder
    return (
      <Button
        variant={variant}
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        className={cn('relative', className)}
        disabled
      >
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <Button
      variant={variant}
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      onClick={toggleTheme}
      className={cn('group relative overflow-hidden', className)}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className={cn(iconSize, 'text-yellow-400 group-hover:text-yellow-300')} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0, rotate: 90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: -90 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className={cn(iconSize, 'text-orange-500 group-hover:text-orange-400')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple effect on click */}
      <motion.span
        className="absolute inset-0 rounded-full"
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background:
            theme === 'dark'
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0, 0, 0, 0.1) 0%, transparent 70%)',
        }}
      />
    </Button>
  );
}

// Compact theme toggle for mobile or tight spaces
export function CompactThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'rounded-lg p-2 transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'focus:ring-gray-500 dark:focus:ring-gray-400',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className="relative h-6 w-6">
        <AnimatePresence mode="wait">
          {theme === 'dark' ? (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="absolute inset-0"
            >
              <Moon className="h-full w-full text-yellow-400" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className="absolute inset-0"
            >
              <Sun className="h-full w-full text-orange-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
