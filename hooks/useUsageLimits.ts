"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export type UsageLimitError = {
  error: {
    code: string;
    message: string;
    featureId: string;
    redirect: string;
    type: 'USAGE_LIMIT_EXCEEDED';
  };
};

export function useUsageLimits() {
  const router = useRouter();

  const handleApiResponse = useCallback(async (response: Response) => {
    if (response.status === 429) {
      try {
        const data: UsageLimitError = await response.json();
        
        if (data.error?.type === 'USAGE_LIMIT_EXCEEDED') {
          // Show user-friendly toast
          toast.error('Usage limit exceeded', {
            description: data.error.message || 'Please upgrade your plan to continue.',
            action: {
              label: 'Upgrade',
              onClick: () => router.push('/pricing')
            },
            duration: 5000
          });
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push(data.error.redirect || '/pricing');
          }, 2000);
          
          return true; // Indicates usage limit was hit
        }
      } catch (err) {
        console.error('Error parsing usage limit response:', err);
      }
    }
    
    return false; // No usage limit hit
  }, [router]);

  const checkUsageLimit = useCallback((data: any): boolean => {
    if (data?.error?.type === 'USAGE_LIMIT_EXCEEDED') {
      toast.error('Usage limit exceeded', {
        description: data.error.message || 'Please upgrade your plan to continue.',
        action: {
          label: 'Upgrade',
          onClick: () => router.push('/pricing')
        },
        duration: 5000
      });
      
      setTimeout(() => {
        router.push('/pricing');
      }, 2000);
      
      return true;
    }
    
    return false;
  }, [router]);

  return {
    handleApiResponse,
    checkUsageLimit
  };
}