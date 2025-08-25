import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LazyLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  minHeight?: number;
}

export const LazyLoader: React.FC<LazyLoaderProps> = ({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  className,
  minHeight = 200,
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [rootMargin, threshold, hasLoaded]);

  const defaultFallback = (
    <div 
      className={cn(
        "flex items-center justify-center bg-gray-50 animate-pulse",
        className
      )}
      style={{ minHeight }}
    >
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );

  return (
    <div ref={ref} className={className}>
      {isIntersecting || hasLoaded ? children : (fallback || defaultFallback)}
    </div>
  );
};

export default LazyLoader;