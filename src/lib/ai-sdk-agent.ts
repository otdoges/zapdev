import { createGateway } from "@ai-sdk/gateway";
import {
  streamText,
  tool,
  type CoreMessage,
  type FinishReason,
  type LanguageModelUsage,
} from "ai";
import { Sandbox } from "@e2b/code-interpreter";
import { z } from "zod";

import { SANDBOX_TIMEOUT, type Framework } from "@/agents/types";

export interface AiSdkAgentOptions {
  sandboxId: string;
  framework: Framework;
  messages: CoreMessage[];
  systemPrompt: string;
  model: string;
  maxSteps?: number;
  onStepFinish?: (params: any) => void;
  onChunk?: (event: any) => void;
}

export interface AiSdkAgentResult {
  text: string;
  files: Record<string, string>;
  finishReason: FinishReason;
  usage: LanguageModelUsage;
  toolResults: unknown[];
}

const createGatewayClient = () =>
  createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
    baseURL:
      process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1/ai",
  });

/**
 * Runs a multi-step coding agent using the Vercel AI SDK gateway provider
 * with E2B sandbox tools (terminal, read, write).
 */
export async function runAiSdkAgent(
  options: AiSdkAgentOptions,
): Promise<AiSdkAgentResult> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI_GATEWAY_API_KEY is required for AI SDK gateway");
  }

  if (!process.env.E2B_API_KEY) {
    throw new Error("E2B_API_KEY is required to connect to sandboxes");
  }

  const gateway = createGatewayClient();
  const sandbox = await Sandbox.connect(options.sandboxId, {
    apiKey: process.env.E2B_API_KEY,
  });

  try {
    await sandbox.setTimeout(SANDBOX_TIMEOUT);

    const trackedFiles: Record<string, string> = {};

    const tools = {
      terminal: tool({
        description: "Run shell commands in the E2B sandbox",
        parameters: z.object({ command: z.string() }),
        execute: async ({ command }: { command: string }) => {
          const result = await sandbox.commands.run(command, {
            timeoutMs: 120_000,
          });

          return {
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
          };
        },
      } as any), // TODO: Replace with proper tool typing when AI SDK accepts typed tool definitions.
      createOrUpdateFiles: tool({
        description: "Create or update files in the sandbox",
        parameters: z.object({
          files: z.array(
            z.object({
              path: z.string(),
              content: z.string(),
            }),
          ),
        }),
        execute: async ({ files }: { files: Array<{ path: string; content: string }> }) => {
          // Perform all file writes in parallel
          const results = await Promise.allSettled(
            files.map(async (file: { path: string; content: string }) => {
              await sandbox.files.write(file.path, file.content);
              return { path: file.path, status: "success" as const };
            }),
          );

          // Separate successful and failed writes
          const successful: Array<{ path: string }> = [];
          const failed: Array<{ path: string; error: string }> = [];

          results.forEach((result, index) => {
            const filePath = files[index].path;
            const fileContent = files[index].content;

            if (result.status === "fulfilled") {
              successful.push({ path: filePath });
              // Only update trackedFiles for successful writes
              trackedFiles[filePath] = fileContent;
            } else {
              const errorMessage =
                result.reason instanceof Error ? result.reason.message : String(result.reason);
              failed.push({ path: filePath, error: errorMessage });
            }
          });

          // Build summary
          const summary = {
            total: files.length,
            succeeded: successful.length,
            failed: failed.length,
            successful: successful.map((s) => s.path),
            failures: failed,
          };

          // Throw error with detailed per-file failures if any writes failed
          if (failed.length > 0) {
            const MAX_FAILURE_DETAILS = 10;
            const displayedFailures = failed.slice(0, MAX_FAILURE_DETAILS);
            const errorDetails = displayedFailures
              .map((f) => `  • ${f.path}: ${f.error}`)
              .join("\n");
            const errorMessage =
              `Failed to write ${failed.length}/${files.length} file(s):\n${errorDetails}${
                failed.length > MAX_FAILURE_DETAILS
                  ? `\n  • ...and ${failed.length - MAX_FAILURE_DETAILS} more`
                  : ""
              }`;
            const error = new Error(errorMessage);
            (error as any).summary = summary;
            throw error;
          }

          // Return success message with summary
          const message =
            successful.length === 1
              ? `Updated 1 file: ${successful[0].path}`
              : `Updated ${successful.length} file(s): ${successful.map((s) => s.path).join(", ")}`;

          return message;
        },
      } as any),
      readFiles: tool({
        description: "Read files from the sandbox",
        parameters: z.object({
          files: z.array(z.string()),
        }),
        execute: async ({ files }: { files: string[] }) => {
          const contents = await Promise.all(
            files.map(async (path) => ({
              path,
              content: await sandbox.files.read(path),
            })),
          );

          return contents;
        },
      } as any), // TODO: Remove cast once tool generics are updated to match streamText requirements.
    };

    // TODO: Remove `as any` casts once AI SDK streamText generic signatures are fixed
    // to properly accept concrete ToolSet types instead of requiring Record<string, ...>.
    // This is a temporary workaround for type mismatch between callbacks typed as
    // Record<string, ...> vs actual tools object passed to streamText.
    const result = await streamText({
      model: gateway(options.model),
      system: options.systemPrompt,
      messages: options.messages,
      tools: tools as any,
      onStepFinish: options.onStepFinish as any,
      onChunk: options.onChunk as any,
    });

    const [text, usage, finishReason, toolResults] = await Promise.all([
      result.text,
      result.totalUsage,
      result.finishReason,
      result.toolResults,
    ]);

    return {
      text,
      files: trackedFiles,
      finishReason,
      usage,
      toolResults,
    };
  } finally {
    const killResult = await Promise.race([
      sandbox.kill(),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 5000)),
    ]);
    if (killResult === "timeout") {
      console.warn("[E2B] sandbox.kill() timed out after 5s");
    }
  }
}
