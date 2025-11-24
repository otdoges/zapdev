import { Sandbox } from "@e2b/code-interpreter";
import { inspect } from "util";

import { validateRequiredEnvVars } from "@/lib/env-validation";
import {
  SANDBOX_TIMEOUT,
  SANDBOX_CREATE_RETRIES,
  SANDBOX_HEALTH_CHECK_TIMEOUT,
  SANDBOX_CACHE_EXPIRY,
  SANDBOX_CACHE_MAX_SIZE,
} from "./constants";

// Validate environment variables at module initialization
validateRequiredEnvVars();

export async function createSandboxWithRetry(
  template: string,
  maxRetries = SANDBOX_CREATE_RETRIES,
): Promise<Sandbox> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let sandbox: Sandbox | null = null;
    try {
      sandbox = await Sandbox.create(template, {
        apiKey: process.env.E2B_API_KEY,
        timeoutMs: SANDBOX_TIMEOUT,
      });

      // Wrap setTimeout in separate try/catch to ensure cleanup on failure
      try {
        await sandbox.setTimeout(SANDBOX_TIMEOUT);
      } catch (setTimeoutError) {
        // Clean up sandbox if setTimeout fails
        try {
          await sandbox.kill();
        } catch (killError) {
          console.error("[E2B] Failed to kill sandbox during setTimeout error:", killError);
        }
        throw setTimeoutError;
      }

      return sandbox;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt >= maxRetries) throw lastError;
      await new Promise((res) => setTimeout(res, Math.min(2000 * attempt, 8000)));
    }
  }

  throw lastError ?? new Error("Sandbox creation failed");
}

export async function validateSandboxHealth(sandbox: Sandbox): Promise<boolean> {
  try {
    const result = await sandbox.commands.run("echo 'health_check'", {
      timeoutMs: SANDBOX_HEALTH_CHECK_TIMEOUT,
    });
    return result.exitCode === 0 && result.stdout.includes("health_check");
  } catch (error) {
    console.error("[E2B] health check failed:", inspect(error, { depth: null }));
    return false;
  }
}

// Sandbox cache with LRU eviction and proper timeout management
interface CacheEntry {
  sandbox: Sandbox;
  timeout: NodeJS.Timeout;
}

const SANDBOX_CACHE = new Map<string, CacheEntry>();

/**
 * Clears a cache entry and its associated timeout.
 */
const clearCacheEntry = (sandboxId: string): void => {
  const entry = SANDBOX_CACHE.get(sandboxId);
  if (entry) {
    clearTimeout(entry.timeout);
    SANDBOX_CACHE.delete(sandboxId);
  }
};

/**
 * Evicts the oldest cache entry if cache size exceeds maximum.
 * Uses Map's insertion order (oldest = first key).
 */
const evictOldestIfNeeded = (): void => {
  if (SANDBOX_CACHE.size >= SANDBOX_CACHE_MAX_SIZE) {
    const oldestKey = SANDBOX_CACHE.keys().next().value;
    if (oldestKey) {
      console.warn(`[E2B Cache] Evicting oldest entry: ${oldestKey}`);
      clearCacheEntry(oldestKey);
    }
  }
};

/**
 * Sets a cache entry with automatic expiration.
 */
const setCacheEntry = (sandboxId: string, sandbox: Sandbox): void => {
  // Clear existing entry if present (prevents duplicate timeouts)
  clearCacheEntry(sandboxId);
  
  // Evict oldest if needed
  evictOldestIfNeeded();
  
  // Create new entry with timeout
  const timeout = setTimeout(() => {
    console.log(`[E2B Cache] Expiring entry: ${sandboxId}`);
    SANDBOX_CACHE.delete(sandboxId);
  }, SANDBOX_CACHE_EXPIRY);
  
  SANDBOX_CACHE.set(sandboxId, { sandbox, timeout });
};

export async function getSandbox(sandboxId: string) {
  const cached = SANDBOX_CACHE.get(sandboxId);
  if (cached) {
    try {
      const healthy = await validateSandboxHealth(cached.sandbox);
      if (healthy) {
        return cached.sandbox;
      }
      console.warn(`[E2B] Cached sandbox ${sandboxId} unhealthy, reconnecting`);
      clearCacheEntry(sandboxId);
      try {
        await cached.sandbox.kill();
      } catch (killError) {
        console.error("[E2B] Failed to kill unhealthy cached sandbox:", killError);
      }
    } catch (error) {
      console.warn("[E2B] Cached sandbox check failed, reconnecting", error);
      clearCacheEntry(sandboxId);
    }
  }

  const sandbox = await Sandbox.connect(sandboxId, {
    apiKey: process.env.E2B_API_KEY,
  });

  try {
    await sandbox.setTimeout(SANDBOX_TIMEOUT);
  } catch (error) {
    console.error("[E2B] Failed to set timeout on sandbox connect:", error);
    try {
      await sandbox.kill();
    } catch (killError) {
      console.error("[E2B] Failed to kill sandbox after timeout error:", killError);
    }
    throw error;
  }

  setCacheEntry(sandboxId, sandbox);
  return sandbox;
}

export async function readFilesFromSandbox(
  sandbox: Sandbox,
  files: string[],
): Promise<{ path: string; content: string }[]> {
  return Promise.all(
    files.map(async (file) => ({
      path: file,
      content: await sandbox.files.read(file),
    })),
  );
}
