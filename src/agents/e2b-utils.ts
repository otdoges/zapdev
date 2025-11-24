import { Sandbox } from "@e2b/code-interpreter";
import { inspect } from "util";

import { SANDBOX_TIMEOUT } from "./types";

export async function createSandboxWithRetry(
  template: string,
  maxRetries = 3,
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
      timeoutMs: 5000,
    });
    return result.exitCode === 0 && result.stdout.includes("health_check");
  } catch (error) {
    console.error("[E2B] health check failed:", inspect(error, { depth: null }));
    return false;
  }
}

const SANDBOX_CACHE = new Map<string, Sandbox>();
const CACHE_EXPIRY = 5 * 60 * 1000;

const clearCacheEntry = (sandboxId: string) => {
  setTimeout(() => SANDBOX_CACHE.delete(sandboxId), CACHE_EXPIRY);
};

export async function getSandbox(sandboxId: string) {
  const cached = SANDBOX_CACHE.get(sandboxId);
  if (cached) return cached;

  const sandbox = await Sandbox.connect(sandboxId, {
    apiKey: process.env.E2B_API_KEY,
  });
  await sandbox.setTimeout(SANDBOX_TIMEOUT);
  SANDBOX_CACHE.set(sandboxId, sandbox);
  clearCacheEntry(sandboxId);
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
