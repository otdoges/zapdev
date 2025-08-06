// Usage tracking service for recording AI and application usage
// This service handles both local storage and Convex database tracking

interface UsageEventData {
  eventName: string;
  metadata: {
    requests?: number;
    duration?: number;
    size?: number;
    conversationId?: string;
    codeExecutionId?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
  };
}

// Local queue for usage events (sent to Convex later)
let usageEventQueue: (UsageEventData & { timestamp: number })[] = [];

// Record a usage event
export async function recordUsageEvent(event: UsageEventData): Promise<void> {
  try {
    const eventWithTimestamp = {
      ...event,
      timestamp: Date.now(),
    };

    // Add to local queue
    usageEventQueue.push(eventWithTimestamp);

    // Store in localStorage as backup
    const existingEvents = JSON.parse(localStorage.getItem('zapdev-usage-events') || '[]');
    existingEvents.push(eventWithTimestamp);
    // Keep only last 1000 events in localStorage
    if (existingEvents.length > 1000) {
      existingEvents.splice(0, existingEvents.length - 1000);
    }
    localStorage.setItem('zapdev-usage-events', JSON.stringify(existingEvents));

    console.log('Usage event recorded:', event.eventName, event.metadata);
  } catch (error) {
    console.error('Error recording usage event:', error);
  }
}

// Batch sync events to Convex (to be called periodically or on user action)
export async function syncUsageEvents(convexClient: { mutation: (name: string, args: Record<string, unknown>) => Promise<unknown> }): Promise<void> {
  if (!convexClient || usageEventQueue.length === 0) {
    return;
  }

  try {
    const eventsToSync = [...usageEventQueue];
    usageEventQueue = []; // Clear queue

    await convexClient.mutation('usageTracking:batchRecordUsageEvents', {
      events: eventsToSync,
    });

    // Clear synced events from localStorage
    localStorage.removeItem('zapdev-usage-events');
    
    console.log(`Synced ${eventsToSync.length} usage events to Convex`);
  } catch (error) {
    // Re-add events to queue on failure
    usageEventQueue.unshift(...usageEventQueue);
    console.error('Error syncing usage events:', error);
    throw error;
  }
}

// Get pending events count
export function getPendingEventsCount(): number {
  return usageEventQueue.length;
}

// Record AI conversation usage
export async function recordAIConversation(params: {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  conversationId?: string;
}): Promise<void> {
  await recordUsageEvent({
    eventName: 'ai_conversation',
    metadata: {
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      cost: params.cost,
      conversationId: params.conversationId,
      requests: 1,
    },
  });
}

// Record code execution usage
export async function recordCodeExecution(params: {
  executionType: 'webcontainer' | 'e2b';
  duration?: number;
  size?: number;
  codeExecutionId?: string;
}): Promise<void> {
  await recordUsageEvent({
    eventName: 'code_execution',
    metadata: {
      codeExecutionId: params.codeExecutionId,
      duration: params.duration,
      size: params.size,
      requests: 1,
    },
  });
}

// Record feature usage
export async function recordFeatureUsage(params: {
  featureName: string;
  context?: string;
  metadata?: Record<string, string | number | boolean>;
}): Promise<void> {
  await recordUsageEvent({
    eventName: 'feature_used',
    metadata: {
      ...params.metadata,
      conversationId: params.context,
      requests: 1,
    },
  });
}