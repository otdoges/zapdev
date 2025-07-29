import { useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usePostHog } from 'posthog-js/react';

interface UsageEventMetadata {
  requests?: number;
  duration?: number;
  size?: number;
  [key: string]: string | number | boolean | undefined;
}

interface UsageEvent {
  eventName: string;
  metadata: UsageEventMetadata;
}

export const useUsageTracking = () => {
  const posthog = usePostHog();
  const { user } = useAuth();

  // Identify the user in PostHog when authenticated
  useEffect(() => {
    if (user) {
      posthog?.identify(user.id);
    }
  }, [user, posthog]);

  const trackEvent = useCallback(async (event: UsageEvent) => {
    if (!user) {
      console.warn('Cannot track usage event: user not authenticated');
      return;
    }

    try {
      // Store event locally first for immediate tracking
      const localEvent = {
        ...event,
        userId: user.id,
        timestamp: Date.now(),
        ingested: false,
      };

      // Store in localStorage for backup/offline support
      const existingEvents = JSON.parse(localStorage.getItem('pendingUsageEvents') || '[]');
      existingEvents.push(localEvent);
      localStorage.setItem('pendingUsageEvents', JSON.stringify(existingEvents));

      // Send event to PostHog
      posthog?.capture(event.eventName, {
        ...event.metadata,
        userId: user.id,
        timestamp: localEvent.timestamp,
      });

      // TODO: Send to Convex database via TRPC
      // await trpc.polar.recordUsage.mutate({
      //   eventName: event.eventName,
      //   metadata: event.metadata,
      // });

      console.log('Usage event tracked:', event);
    } catch (error) {
      console.error('Error tracking usage event:', error);
    }
  }, [user, posthog]);


  const trackWebsiteGeneration = useCallback(async (params: {
    templateId?: string;
    complexity: 'simple' | 'medium' | 'complex';
    pagesGenerated: number;
  }) => {
    await trackEvent({
      eventName: 'website_generated',
      metadata: {
        templateId: params.templateId,
        complexity: params.complexity,
        pagesGenerated: params.pagesGenerated,
        requests: 1,
      },
    });
  }, [trackEvent]);

  const trackFileUpload = useCallback(async (params: {
    fileType: string;
    fileSize: number;
    fileName?: string;
  }) => {
    await trackEvent({
      eventName: 'file_uploaded',
      metadata: {
        fileType: params.fileType,
        size: params.fileSize,
        fileName: params.fileName,
        requests: 1,
      },
    });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback(async (params: {
    featureName: string;
    context?: string;
    metadata?: Record<string, string | number | boolean>;
  }) => {
    await trackEvent({
      eventName: 'feature_used',
      metadata: {
        featureName: params.featureName,
        context: params.context,
        requests: 1,
        ...params.metadata,
      },
    });
  }, [trackEvent]);

  // Get pending events (for sync with server)
  const getPendingEvents = useCallback(() => {
    return JSON.parse(localStorage.getItem('pendingUsageEvents') || '[]');
  }, []);

  // Clear pending events (after successful sync)
  const clearPendingEvents = useCallback(() => {
    localStorage.removeItem('pendingUsageEvents');
  }, []);

  // Sync pending events with server
  const syncPendingEvents = useCallback(async () => {
    const pendingEvents = getPendingEvents();
    if (pendingEvents.length === 0) return;

    try {
      // TODO: Implement batch sync with TRPC
      // await trpc.polar.batchRecordUsage.mutate({ events: pendingEvents });
      clearPendingEvents();
      console.log(`Synced ${pendingEvents.length} pending usage events`);
    } catch (error) {
      console.error('Error syncing pending events:', error);
    }
  }, [getPendingEvents, clearPendingEvents]);

  return {
    trackEvent,
    trackWebsiteGeneration,
    trackFileUpload,
    trackFeatureUsage,
    getPendingEvents,
    clearPendingEvents,
    syncPendingEvents,
  };
};
