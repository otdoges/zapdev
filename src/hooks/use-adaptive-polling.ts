import { useEffect, useState } from 'react';

export interface AdaptivePollingConfig {
  /** Initial fast polling interval (ms) when waiting for response */
  fastInterval?: number;
  /** Slower interval (ms) when idle */
  slowInterval?: number;
  /** Duration (ms) to use fast polling before switching to slow */
  fastDuration?: number;
}

const DEFAULT_CONFIG: Required<AdaptivePollingConfig> = {
  fastInterval: 500, // 500ms when actively waiting (4x faster!)
  slowInterval: 3000, // 3s when idle
  fastDuration: 30000, // Stay fast for 30s after user message
};

/**
 * Adaptive polling hook that starts fast and slows down over time
 * This dramatically improves perceived performance
 */
export function useAdaptivePolling(
  isWaitingForResponse: boolean,
  config: AdaptivePollingConfig = {}
): number {
  const { fastInterval, slowInterval, fastDuration } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const [interval, setInterval] = useState(slowInterval);

  useEffect(() => {
    if (isWaitingForResponse) {
      // Start with fast polling
      setInterval(fastInterval);

      // After fastDuration, switch to slow polling
      const timeout = setTimeout(() => {
        setInterval(slowInterval);
      }, fastDuration);

      return () => clearTimeout(timeout);
    } else {
      // Not waiting, use slow polling
      setInterval(slowInterval);
    }
  }, [isWaitingForResponse, fastInterval, slowInterval, fastDuration]);

  return interval;
}
