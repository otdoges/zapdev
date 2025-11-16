import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, Message, TextMessage } from "@inngest/agent-kit";

import { SANDBOX_TIMEOUT } from "./types";

const SANDBOX_CACHE = new Map<string, Sandbox>();
const CACHE_EXPIRY = 5 * 60 * 1000;

const clearCacheEntry = (sandboxId: string) => {
  setTimeout(() => {
    SANDBOX_CACHE.delete(sandboxId);
  }, CACHE_EXPIRY);
};

/**
 * Detect if error is from E2B API (rate limits, quota, service issues)
 */
export function isE2BApiError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("quota exceeded") ||
    errorMessage.includes("too many requests") ||
    errorMessage.includes("service unavailable") ||
    errorMessage.includes("internal server error") ||
    errorMessage.includes("429") ||
    errorMessage.includes("503") ||
    errorMessage.includes("500")
  );
}

/**
 * Detect if error is transient and should be retried
 */
export function isE2BTransientError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection reset") ||
    errorMessage.includes("ECONNRESET") ||
    errorMessage.includes("ETIMEDOUT") ||
    errorMessage.includes("503") ||
    errorMessage.includes("502") ||
    errorMessage.includes("504")
  );
}

/**
 * Detect if error is a permanent failure (don't retry)
 */
export function isE2BPermanentError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes("authentication") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("401") ||
    errorMessage.includes("403") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("not found") ||
    errorMessage.includes("404")
  );
}

/**
 * Create sandbox with retry logic and exponential backoff
 */
export async function createSandboxWithRetry(
  template: string,
  maxRetries: number = 3
): Promise<Sandbox> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DEBUG] Sandbox creation attempt ${attempt}/${maxRetries} for template: ${template}`);
      const startTime = Date.now();

      const sandbox = await Sandbox.create(template, {
        apiKey: process.env.E2B_API_KEY,
        timeoutMs: SANDBOX_TIMEOUT,
      });

      // Validate sandbox is ready
      await sandbox.setTimeout(SANDBOX_TIMEOUT);
      
      const duration = Date.now() - startTime;
      console.log(`[E2B_METRICS]`, {
        event: "sandbox_create_success",
        sandboxId: sandbox.sandboxId,
        template,
        attempt,
        duration,
        timestamp: Date.now(),
      });

      return sandbox;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - (Date.now() - 1000);
      
      console.error(`[E2B_METRICS]`, {
        event: "sandbox_create_failure",
        template,
        attempt,
        error: lastError.message,
        duration,
        timestamp: Date.now(),
      });

      // Don't retry on permanent errors
      if (isE2BPermanentError(lastError)) {
        console.error(`[ERROR] Permanent E2B error detected, not retrying: ${lastError.message}`);
        throw lastError;
      }

      // If this is the last attempt, throw
      if (attempt >= maxRetries) {
        console.error(`[ERROR] Max retry attempts (${maxRetries}) reached for sandbox creation`);
        throw lastError;
      }

      // Retry on transient errors with exponential backoff
      if (isE2BTransientError(lastError)) {
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[DEBUG] Transient error detected, retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Rate limit detected - longer backoff
      if (isE2BApiError(lastError)) {
        const delayMs = 30000; // 30 seconds for rate limits
        console.warn(`[WARN] E2B rate limit or API error detected, backing off ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Unknown error - use standard backoff
      const delayMs = Math.min(2000 * Math.pow(2, attempt - 1), 15000);
      console.log(`[DEBUG] Unknown error, retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error("Sandbox creation failed after retries");
}

/**
 * Validate sandbox health with a quick command
 */
export async function validateSandboxHealth(sandbox: Sandbox): Promise<boolean> {
  try {
    const result = await sandbox.commands.run("echo 'health_check'", {
      timeoutMs: 5000,
    });
    const isHealthy = result.exitCode === 0 && result.stdout.includes("health_check");
    
    if (!isHealthy) {
      console.warn("[WARN] Sandbox health check failed - unexpected output");
    }
    
    return isHealthy;
  } catch (error) {
    console.error("[ERROR] Sandbox health check failed:", error);
    return false;
  }
}

export async function getSandbox(sandboxId: string) {
  const cached = SANDBOX_CACHE.get(sandboxId);
  if (cached) {
    return cached;
  }
  
  try {
    // Sandbox.connect() automatically resumes if paused
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: process.env.E2B_API_KEY,
    });
    await sandbox.setTimeout(SANDBOX_TIMEOUT);
    
    SANDBOX_CACHE.set(sandboxId, sandbox);
    clearCacheEntry(sandboxId);
    
    console.log(`[DEBUG] Connected to sandbox ${sandboxId} (auto-resumed if paused)`);
    
    return sandbox;
  } catch (error) {
    console.error("[ERROR] Failed to connect to E2B sandbox:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if sandbox was deleted or expired (>30 days)
    if (errorMessage.includes("not found") || errorMessage.includes("not exist")) {
      console.warn(`[WARN] Sandbox ${sandboxId} not found - may be expired or deleted`);
    }
    
    throw new Error(`E2B sandbox connection failed: ${errorMessage}`);
  }
}

export async function readFilesFromSandbox(
  sandbox: Sandbox,
  files: string[]
): Promise<{ path: string; content: string }[]> {
  try {
    return await Promise.all(
      files.map(async (file) => ({
        path: file,
        content: await sandbox.files.read(file),
      }))
    );
  } catch (error) {
    console.error("[ERROR] Failed to read files from sandbox:", error);
    return [];
  }
}

export function lastAssistantTextMessageContent(result: AgentResult) {
  const lastAssistantTextMessageIndex = result.output.findLastIndex(
    (message) => message.role === "assistant",
  );

  const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;

  return message?.content
    ? typeof message.content === "string"
      ? message.content
      : message.content.map((c) => c.text).join("")
    : undefined;
}

export const parseAgentOutput = (value?: Message[]) => {
  if (!value || value.length === 0) {
    return "Fragment";
  }

  const output = value[0];

  if (output.type !== "text") {
    return "Fragment";
  }

  if (Array.isArray(output.content)) {
    return output.content.map((txt) => (typeof txt === "string" ? txt : txt.text ?? "")).join("")
  } else {
    return output.content
  }
};
