'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps } from './button';

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
    style,
    ...props 
  }, ref) => {
    // Simple CSS classes for the button
    const buttonClasses = cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium',
      'transition-all duration-200 ease-in-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'transform-gpu',
      className
    );
    
    // Use regular button with CSS-only animations for maximum compatibility
    return (
      <button
        ref={ref}
        className={buttonClasses}
        style={style}
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