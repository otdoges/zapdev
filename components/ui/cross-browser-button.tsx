'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps } from './button';

// Check if framer-motion is available and working
const useMotionSafely = () => {
  const [motionSupported, setMotionSupported] = React.useState(false);
  
  React.useEffect(() => {
    try {
      // Try to import framer-motion dynamically
      import('framer-motion').then(() => {
        setMotionSupported(true);
      }).catch(() => {
        setMotionSupported(false);
      });
    } catch {
      setMotionSupported(false);
    }
  }, []);
  
  return motionSupported;
};

interface CrossBrowserButtonProps extends ButtonProps {
  enableMotion?: boolean;
  motionProps?: {
    whileHover?: any;
    whileTap?: any;
    initial?: any;
    animate?: any;
    transition?: any;
  };
}

const CrossBrowserButton = React.forwardRef<HTMLButtonElement, CrossBrowserButtonProps>(
  ({ 
    className, 
    children, 
    enableMotion = true, 
    motionProps = {},
    ...props 
  }, ref) => {
    const motionSupported = useMotionSafely();
    const [isHovered, setIsHovered] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);
    
    // Default motion props
    const defaultMotionProps = {
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.95 },
      ...motionProps
    };
    
    // CSS classes for fallback animations
    const buttonClasses = cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'transform-gpu will-change-transform',
      // Cross-browser support
      'backface-visibility-hidden',
      // Hover effects (CSS fallback)
      !motionSupported && isHovered && 'scale-105',
      !motionSupported && isPressed && 'scale-95',
      className
    );
    
    // If motion is supported and enabled, use dynamic import
    if (motionSupported && enableMotion) {
      const [MotionButton, setMotionButton] = React.useState<any>(null);
      
      React.useEffect(() => {
        import('framer-motion').then(({ motion }) => {
          setMotionButton(() => motion.button);
        });
      }, []);
      
      if (MotionButton) {
        return (
          <MotionButton
            ref={ref}
            className={buttonClasses}
            {...defaultMotionProps}
            {...props}
          >
            {children}
          </MotionButton>
        );
      }
    }
    
    // Fallback to regular button with CSS animations
    return (
      <button
        ref={ref}
        className={buttonClasses}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onBlur={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CrossBrowserButton.displayName = 'CrossBrowserButton';

export { CrossBrowserButton };
export type { CrossBrowserButtonProps }; 