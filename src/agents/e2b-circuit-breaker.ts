import { Mutex } from 'async-mutex';
import { CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT } from './constants';

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  threshold?: number;
  timeout?: number;
  name?: string;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: CircuitBreakerState = "CLOSED";
  private readonly testMutex = new Mutex();
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.threshold = options.threshold ?? CIRCUIT_BREAKER_THRESHOLD;
    this.timeout = options.timeout ?? CIRCUIT_BREAKER_TIMEOUT;
    this.name = options.name ?? "CircuitBreaker";
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        // Use mutex to prevent race condition when transitioning to HALF_OPEN
        return this.testMutex.runExclusive(async () => {
          // Double-check state after acquiring lock (another request might have recovered)
          if (this.state !== "OPEN") {
            // State changed while waiting for lock, just execute
            return this.executeWithTracking(fn);
          }
          
          // Transition to HALF_OPEN and test recovery
          this.state = "HALF_OPEN";
          console.log(`[${this.name}] HALF_OPEN - testing service recovery`);
          
          return this.executeWithTracking(fn);
        });
      } else {
        const remaining = this.timeout - (Date.now() - this.lastFailureTime);
        throw new Error(
          `Circuit breaker OPEN for ${this.name}. Retry in ${Math.ceil(
            remaining / 1000,
          )}s.`,
        );
      }
    }

    return this.executeWithTracking(fn);
  }

  private async executeWithTracking<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === "HALF_OPEN") {
      console.log(`[${this.name}] HALF_OPEN test succeeded, resetting to CLOSED`);
      this.reset();
    } else if (this.failures > 0) {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  private onFailure() {
    this.failures += 1;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      console.error(
        `[${this.name}] Circuit breaker OPEN after HALF_OPEN failure (failures=${this.failures})`,
      );
      return;
    }

    if (this.failures >= this.threshold) {
      this.state = "OPEN";
      console.error(
        `[${this.name}] Circuit breaker OPEN after ${this.failures} failures`,
      );
    }
  }

  private reset() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

export const e2bCircuitBreaker = new CircuitBreaker({
  threshold: CIRCUIT_BREAKER_THRESHOLD,
  timeout: CIRCUIT_BREAKER_TIMEOUT,
  name: "E2B",
});
