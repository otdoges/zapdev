// Token-bucket rate limiter factory
// Encapsulates state and returns an enforce() function

export function createTokenBucketRateLimiter(
  burst: number,
  refillMs: number,
  errorMessage: string
): () => void {
  const state: { tokens: number; lastTimestamp: number } = {
    tokens: burst,
    lastTimestamp: 0,
  };

  return function enforce(): void {
    const now = Date.now();

    if (now - state.lastTimestamp > refillMs) {
      state.tokens = burst;
      state.lastTimestamp = now;
    }

    if (state.tokens <= 0) {
      throw new Error(errorMessage);
    }

    state.tokens -= 1;
  };
}


