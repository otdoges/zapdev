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
  private testingRequestInFlight = false;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.threshold = options.threshold ?? 5;
    this.timeout = options.timeout ?? 60000;
    this.name = options.name ?? "CircuitBreaker";
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        if (this.testingRequestInFlight) {
          throw new Error(
            `Circuit breaker HALF_OPEN test already in progress for ${this.name}.`,
          );
        }
        this.testingRequestInFlight = true;
        this.state = "HALF_OPEN";
        console.log(`[${this.name}] HALF_OPEN - testing service recovery`);
      } else {
        const remaining = this.timeout - (Date.now() - this.lastFailureTime);
        throw new Error(
          `Circuit breaker OPEN for ${this.name}. Retry in ${Math.ceil(
            remaining / 1000,
          )}s.`,
        );
      }
    } else if (this.state === "HALF_OPEN") {
      if (this.testingRequestInFlight) {
        throw new Error(
          `Circuit breaker HALF_OPEN test already in progress for ${this.name}.`,
        );
      }
      this.testingRequestInFlight = true;
    }

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
    if (this.testingRequestInFlight) {
      this.testingRequestInFlight = false;
    }

    if (this.state === "HALF_OPEN") {
      this.reset();
    } else if (this.failures > 0) {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  private onFailure() {
    if (this.testingRequestInFlight) {
      this.testingRequestInFlight = false;
    }
    this.failures += 1;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      return;
    }

    if (this.failures >= this.threshold) {
      this.state = "OPEN";
    }
  }

  private reset() {
    this.failures = 0;
    this.state = "CLOSED";
    this.testingRequestInFlight = false;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

export const e2bCircuitBreaker = new CircuitBreaker({
  threshold: 5,
  timeout: 60000,
  name: "E2B",
});
