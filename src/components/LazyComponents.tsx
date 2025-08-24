import { lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';

// Lazy load heavy components to improve initial bundle size
export const LazyEnhancedChatInterface = lazy(() => 
  import('./EnhancedChatInterface').then(module => ({ default: module.EnhancedChatInterface }))
);

export const LazyWebsiteCloneDialog = lazy(() => 
  import('./WebsiteCloneDialog').then(module => ({ default: module.WebsiteCloneDialog }))
);

export const LazyLoadingStates = lazy(() => 
  import('./LoadingStates').then(module => ({ default: module.LoadingStates }))
);

export const LazySmartPrompts = lazy(() => 
  import('./SmartPrompts').then(module => ({ default: module.SmartPrompts }))
);

export const LazyLivePreview = lazy(() => 
  import('./LivePreview').then(module => ({ default: module.LivePreview }))
);

// High-performance fallback component
const OptimizedFallback = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    {children}
  </div>
);

// Wrapper components with optimized suspense boundaries
export const SuspendedChatInterface = (props: any) => (
  <Suspense fallback={<OptimizedFallback className="min-h-[400px]" />}>
    <LazyEnhancedChatInterface {...props} />
  </Suspense>
);

export const SuspendedWebsiteCloneDialog = (props: any) => (
  <Suspense fallback={<OptimizedFallback className="min-h-[200px]" />}>
    <LazyWebsiteCloneDialog {...props} />
  </Suspense>
);

export const SuspendedLoadingStates = (props: any) => (
  <Suspense fallback={<OptimizedFallback className="min-h-[100px]" />}>
    <LazyLoadingStates {...props} />
  </Suspense>
);

export const SuspendedSmartPrompts = (props: any) => (
  <Suspense fallback={<OptimizedFallback className="min-h-[150px]" />}>
    <LazySmartPrompts {...props} />
  </Suspense>
);

export const SuspendedLivePreview = (props: any) => (
  <Suspense fallback={<OptimizedFallback className="min-h-[300px]" />}>
    <LazyLivePreview {...props} />
  </Suspense>
);

export default {
  SuspendedChatInterface,
  SuspendedWebsiteCloneDialog,
  SuspendedLoadingStates,
  SuspendedSmartPrompts,
  SuspendedLivePreview,
};