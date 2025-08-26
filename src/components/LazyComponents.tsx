import React, { lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import type { WebsiteAnalysis } from '@/lib/firecrawl';
import type { LivePreviewProps } from './LivePreview';

// Lazy load heavy components to improve initial bundle size
export const LazyEnhancedChatInterface = lazy(() => 
  import('./EnhancedChatInterface').then(module => ({ default: module.EnhancedChatInterface }))
);

export const LazyWebsiteCloneDialog = lazy(() => 
  import('./WebsiteCloneDialog').then(module => ({ default: module.WebsiteCloneDialog }))
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
interface WebsiteCloneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCloneRequest: (analysis: WebsiteAnalysis, clonePrompt: string) => void;
}

interface SmartPromptsProps {
  onPromptSelect: (prompt: string) => void;
  isVisible: boolean;
}


export const SuspendedWebsiteCloneDialog: React.FC<WebsiteCloneDialogProps> = (props) => (
  <Suspense fallback={<OptimizedFallback className="min-h-[200px]" />}>
    <LazyWebsiteCloneDialog {...props} />
  </Suspense>
);

export const SuspendedSmartPrompts: React.FC<SmartPromptsProps> = (props) => (
  <Suspense fallback={<OptimizedFallback className="min-h-[150px]" />}>
    <LazySmartPrompts {...props} />
  </Suspense>
);

export const SuspendedLivePreview: React.FC<LivePreviewProps> = (props) => (
  <Suspense fallback={<OptimizedFallback className="min-h-[300px]" />}>
    <LazyLivePreview {...props} />
  </Suspense>
);

export default {
  SuspendedWebsiteCloneDialog,
  SuspendedSmartPrompts,
  SuspendedLivePreview,
};