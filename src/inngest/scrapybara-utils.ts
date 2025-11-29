import { scrapybaraClient, type ScrapybaraInstance } from "@/lib/scrapybara-client";

/**
 * IMPORTANT: In-memory instance caching in serverless environments
 *
 * In-memory caches in serverless functions (Inngest/AWS Lambda) are ephemeral:
 * - They persist ONLY within a single function invocation
 * - They do NOT persist across:
 *   - Function cold starts (common in Inngest)
 *   - Different execution environments
 *   - Invocations spaced more than seconds apart
 *
 * We keep a minimal in-memory cache for within-invocation reuse only.
 * For persistence across function invocations, use Convex storage.
 */

// In-memory cache for instances within a single invocation
// NOTE: This cache does NOT persist across cold starts
const INSTANCE_CACHE = new Map<
  string,
  { instance: ScrapybaraInstance; timestamp: number }
>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes (within single invocation)

/**
 * Categorize errors as transient or permanent
 */
function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ETIMEDOUT|503|502|429/i.test(message);
}

/**
 * Create a Scrapybara sandbox with retry logic and exponential backoff
 */
export async function createScrapybaraSandboxWithRetry(
  template: string = "ubuntu",
  maxRetries: number = 3,
): Promise<{ id: string; instance: ScrapybaraInstance }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(
        `[SCRAPYBARA] Creating sandbox (attempt ${attempt + 1}/${maxRetries})`,
      );

      const sandbox = await scrapybaraClient.createSandbox({
        template,
        timeout_hours: 1,
      });

      console.log(`[SCRAPYBARA] Successfully created sandbox: ${sandbox.id}`);

      // Cache the instance
      INSTANCE_CACHE.set(sandbox.id, {
        instance: sandbox.instance,
        timestamp: Date.now(),
      });

      return {
        id: sandbox.id,
        instance: sandbox.instance,
      };
    } catch (error) {
      lastError = error;

      // Check if error is permanent
      if (!isTransientError(error)) {
        console.error(
          `[SCRAPYBARA] Permanent error, not retrying: ${error}`,
        );
        throw error;
      }

      // Handle rate limiting with longer backoff
      const message = error instanceof Error ? error.message : String(error);
      if (/429/i.test(message)) {
        console.log(
          `[SCRAPYBARA] Rate limit hit, waiting 30s before retry...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 30000));
        continue;
      }

      // Exponential backoff for transient errors
      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(
          `[SCRAPYBARA] Transient error, retrying in ${backoffMs}ms: ${error}`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `Failed to create Scrapybara sandbox after ${maxRetries} attempts: ${lastError}`,
  );
}

/**
 * Get or reconnect to an existing Scrapybara sandbox
 * Uses in-memory cache as primary, falls back to SDK reconnection
 */
export async function getScrapybaraSandbox(
  sandboxId: string,
): Promise<ScrapybaraInstance> {
  // Check cache first
  const cached = INSTANCE_CACHE.get(sandboxId);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_EXPIRY) {
      console.log(
        `[SCRAPYBARA] Using cached instance for sandbox: ${sandboxId}`,
      );
      return cached.instance;
    } else {
      console.log(`[SCRAPYBARA] Cache expired for sandbox: ${sandboxId}`);
      INSTANCE_CACHE.delete(sandboxId);
    }
  }

  // Try to reconnect using SDK
  try {
    console.log(
      `[SCRAPYBARA] Attempting to reconnect to existing sandbox: ${sandboxId}`,
    );

    // Note: SDK reconnection method may vary - using getSandbox pattern
    // If this fails, implement alternative caching or creation strategy
    const sandbox = await scrapybaraClient.getSandbox(sandboxId, "ubuntu");

    // Cache the reconnected instance
    INSTANCE_CACHE.set(sandboxId, {
      instance: sandbox.instance,
      timestamp: Date.now(),
    });

    console.log(`[SCRAPYBARA] Successfully reconnected to sandbox: ${sandboxId}`);
    return sandbox.instance;
  } catch (error) {
    console.error(
      `[SCRAPYBARA] Failed to reconnect to sandbox ${sandboxId}: ${error}`,
    );
    throw new Error(`Cannot reconnect to sandbox ${sandboxId}: ${error}`);
  }
}

/**
 * Validate sandbox health with a simple test command
 */
export async function validateScrapybaraSandboxHealth(
  instance: ScrapybaraInstance,
): Promise<boolean> {
  try {
    console.log(`[SCRAPYBARA] Validating sandbox health...`);

    // Run a simple health check command with timeout
    const healthCheckPromise = instance.bash({
      command: "echo 'health_check'",
    });

    // 5-second timeout for health check
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Health check timeout")), 5000),
    );

    await Promise.race([healthCheckPromise, timeoutPromise]);

    console.log(`[SCRAPYBARA] Sandbox health check passed`);
    return true;
  } catch (error) {
    console.error(`[SCRAPYBARA] Sandbox health check failed: ${error}`);
    return false;
  }
}

/**
 * Clear expired instances from cache
 * Call periodically to prevent memory leaks
 */
export function clearExpiredCaches(): void {
  const now = Date.now();
  let cleared = 0;

  for (const [id, data] of INSTANCE_CACHE.entries()) {
    if (now - data.timestamp > CACHE_EXPIRY) {
      INSTANCE_CACHE.delete(id);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`[SCRAPYBARA] Cleared ${cleared} expired cache entries`);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): { size: number; expiry: number } {
  return {
    size: INSTANCE_CACHE.size,
    expiry: CACHE_EXPIRY,
  };
}
